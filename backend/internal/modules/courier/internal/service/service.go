package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"tools/internal/modules/courier/internal"
	"tools/internal/modules/courier/internal/sqlc"
)

type Service struct {
	db *sql.DB
	q  *sqlc.Queries
}

func New(db *sql.DB) *Service { return &Service{db: db, q: sqlc.New(db)} }

func (s *Service) Orders(ctx context.Context, courierID uint64) ([]internal.AssignmentDTO, error) {
	rows, err := s.q.GetCourierAssignedOrders(ctx, courierID)
	if err != nil {
		return nil, err
	}
	out := make([]internal.AssignmentDTO, 0, len(rows))
	for _, r := range rows {
		out = append(out, internal.MapAssignment(r))
	}
	return out, nil
}

func (s *Service) Accept(ctx context.Context, orderID, courierID uint64) error {
	return s.respond(ctx, orderID, courierID, true)
}

func (s *Service) Decline(ctx context.Context, orderID, courierID uint64) error {
	return s.respond(ctx, orderID, courierID, false)
}

func (s *Service) respond(ctx context.Context, orderID, courierID uint64, accept bool) error {
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
	// After decline/reassignment there is no current owned assignment to change.
	if !order.CourierID.Valid || uint64(order.CourierID.Int64) != courierID {
		return fmt.Errorf("%w: you are not the current courier for this order; the assignment may have been declined or reassigned", internal.ErrConflict)
	}
	if order.Status != sqlc.OrdersStatusPending {
		return fmt.Errorf("%w: assignments can only be accepted or declined while the order is pending (current status: %s)", internal.ErrConflict, order.Status)
	}
	assignment, err := q.GetCourierAssignment(ctx, sqlc.GetCourierAssignmentParams{OrderID: orderID, CourierID: courierID})
	if errors.Is(err, sql.ErrNoRows) {
		return fmt.Errorf("%w: there is no pending or accepted assignment for you on this order", internal.ErrConflict)
	}
	if err != nil {
		return err
	}
	if assignment.AssignmentStatus != sqlc.CourierAssignmentsStatusPending {
		return fmt.Errorf("%w: only pending assignments can be accepted or declined (current assignment status: %s)", internal.ErrConflict, assignment.AssignmentStatus)
	}
	var affected int64
	if accept {
		affected, err = q.AcceptCourierAssignment(ctx, sqlc.AcceptCourierAssignmentParams{OrderID: orderID, CourierID: courierID})
	} else {
		affected, err = q.DeclineCourierAssignment(ctx, sqlc.DeclineCourierAssignmentParams{OrderID: orderID, CourierID: courierID})
	}
	if err = checkRows(affected, err, "the pending assignment could not be updated; reload your assignments and try again"); err != nil {
		return err
	}
	if !accept {
		affected, err = q.ClearDeclinedOrderCourier(ctx, sqlc.ClearDeclinedOrderCourierParams{OrderID: orderID, CourierID: order.CourierID})
		if err = checkRows(affected, err, "the declined courier could not be cleared from the order; the decline was rolled back"); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func validTransition(old, next sqlc.OrdersStatus) bool {
	switch old {
	case sqlc.OrdersStatusPending:
		return next == sqlc.OrdersStatusPickedUp
	case sqlc.OrdersStatusPickedUp:
		return next == sqlc.OrdersStatusInTransit
	case sqlc.OrdersStatusInTransit:
		return next == sqlc.OrdersStatusDelivered
	default:
		return false
	}
}

func (s *Service) UpdateStatus(ctx context.Context, orderID, courierID uint64, next string) error {
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
	if !order.CourierID.Valid || uint64(order.CourierID.Int64) != courierID {
		return internal.ErrNotFound
	}
	status := sqlc.OrdersStatus(next)
	if !validTransition(order.Status, status) {
		return fmt.Errorf("%w: cannot change order status from %s to %s", internal.ErrConflict, order.Status, status)
	}
	affected, err := q.UpdateCourierOrderStatus(ctx, sqlc.UpdateCourierOrderStatusParams{
		OrderID: orderID, CourierID: order.CourierID, ExpectedStatus: order.Status, NewStatus: status,
	})
	// The SQL also requires an accepted assignment for this current courier.
	if err = checkRows(affected, err, "accept your current assignment before updating the delivery status"); err != nil {
		return err
	}
	affected, err = q.CreateOrderStatusHistory(ctx, sqlc.CreateOrderStatusHistoryParams{
		OrderID: orderID, ChangedBy: courierID, OldStatus: sql.NullString{String: string(order.Status), Valid: true}, NewStatus: next,
	})
	if err = checkRows(affected, err, "the delivery status change could not be recorded; the update was rolled back"); err != nil {
		return err
	}
	return tx.Commit()
}

func orderError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return internal.ErrNotFound
	}
	return err
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

func (s *Service) Couriers(ctx context.Context) ([]internal.CourierDTO, error) {
	rows, err := s.q.GetCouriers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]internal.CourierDTO, 0, len(rows))
	for _, r := range rows {
		out = append(out, internal.CourierDTO{ID: r.ID, Name: r.Name, Email: r.Email, Phone: r.Phone})
	}
	return out, nil
}
