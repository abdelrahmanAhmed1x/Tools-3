package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"tools/internal/modules/orders/internal"
	"tools/internal/modules/orders/internal/sqlc"
)

// Delivery can move forward one step. Admins may additionally cancel pending orders.
func validTransition(old, next sqlc.OrdersStatus) bool {
	switch old {
	case sqlc.OrdersStatusPending:
		return next == sqlc.OrdersStatusPickedUp || next == sqlc.OrdersStatusCancelled
	case sqlc.OrdersStatusPickedUp:
		return next == sqlc.OrdersStatusInTransit
	case sqlc.OrdersStatusInTransit:
		return next == sqlc.OrdersStatusDelivered
	default:
		return false
	}
}

func (s *Service) Cancel(ctx context.Context, orderID, userID uint64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	q := s.q.WithTx(tx)
	order, err := q.GetOrderForUpdate(ctx, orderID)
	if err != nil {
		return orderError(err)
	}
	if order.UserID != userID {
		return internal.ErrNotFound
	}
	if order.Status != sqlc.OrdersStatusPending {
		return fmt.Errorf("%w: only pending orders can be cancelled (current status: %s)", internal.ErrConflict, order.Status)
	}
	rows, err := q.CancelPendingOrder(ctx, sqlc.CancelPendingOrderParams{OrderID: orderID, UserID: userID})
	if err = checkRows(rows, err, "the order could not be cancelled; reload the order and try again"); err != nil {
		return err
	}
	if err := recordHistory(ctx, q, orderID, userID, order.Status, sqlc.OrdersStatusCancelled); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Service) UpdateStatus(ctx context.Context, orderID, adminID uint64, next string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	q := s.q.WithTx(tx)
	order, err := q.GetOrderForUpdate(ctx, orderID)
	if err != nil {
		return orderError(err)
	}
	status := sqlc.OrdersStatus(next)
	if !validTransition(order.Status, status) {
		return fmt.Errorf("%w: cannot change order status from %s to %s", internal.ErrConflict, order.Status, status)
	}
	rows, err := q.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{OrderID: orderID, NewStatus: status, ExpectedStatus: order.Status})
	if err = checkRows(rows, err, "the order status could not be updated; reload the order and try again"); err != nil {
		return err
	}
	if err := recordHistory(ctx, q, orderID, adminID, order.Status, status); err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Service) AssignCourier(ctx context.Context, orderID, courierID uint64) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	q := s.q.WithTx(tx)
	order, err := q.GetOrderForUpdate(ctx, orderID)
	if err != nil {
		return orderError(err)
	}
	if order.Status != sqlc.OrdersStatusPending {
		return fmt.Errorf("%w: couriers can only be assigned or reassigned while the order is pending (current status: %s)", internal.ErrConflict, order.Status)
	}
	courier, err := q.GetUserByID(ctx, courierID)
	if errors.Is(err, sql.ErrNoRows) {
		return internal.ErrCourierNotFound
	}
	if err != nil {
		return err
	}
	if courier.Role != sqlc.UsersRoleCourier {
		return internal.ErrCourierNotFound
	}
	// Assigning the current courier again is a conflict, not a new assignment.
	if order.CourierID.Valid && uint64(order.CourierID.Int64) == courierID {
		return fmt.Errorf("%w: this courier is already assigned to the order", internal.ErrConflict)
	}
	affected, err := q.ReassignPreviousCourier(ctx, orderID)
	if err != nil {
		return err
	}
	if order.CourierID.Valid && affected != 1 {
		return fmt.Errorf("%w: the current courier assignment could not be reassigned; reload the order and try again", internal.ErrConflict)
	}
	if !order.CourierID.Valid && affected != 0 {
		return fmt.Errorf("%w: an active assignment exists without a current order courier; the assignment data must be corrected", internal.ErrConflict)
	}
	result, err := q.CreateCourierAssignment(ctx, sqlc.CreateCourierAssignmentParams{OrderID: orderID, CourierID: courierID})
	if err != nil {
		return err
	}
	affected, err = result.RowsAffected()
	if err = checkRows(affected, err, "the new courier assignment could not be created"); err != nil {
		return err
	}
	affected, err = q.SetOrderCourier(ctx, sqlc.SetOrderCourierParams{OrderID: orderID, CourierID: sql.NullInt64{Int64: int64(courierID), Valid: true}})
	if err = checkRows(affected, err, "the order courier could not be updated; reload the order and try again"); err != nil {
		return err
	}
	return tx.Commit()
}

func checkRows(rows int64, err error, message string) error {
	if err != nil {
		return err
	}
	if rows != 1 {
		return fmt.Errorf("%w: %s", internal.ErrConflict, message)
	}
	return nil
}

func recordHistory(ctx context.Context, q *sqlc.Queries, orderID, actorID uint64, old, next sqlc.OrdersStatus) error {
	rows, err := q.CreateOrderStatusHistory(ctx, sqlc.CreateOrderStatusHistoryParams{
		OrderID: orderID, ChangedBy: actorID, OldStatus: sql.NullString{String: string(old), Valid: true}, NewStatus: string(next),
	})
	return checkRows(rows, err, "the order status change could not be recorded; the operation was rolled back")
}
