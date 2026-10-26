package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"tools/internal/modules/orders/internal"
	"tools/internal/modules/orders/internal/sqlc"
)

type Service struct {
	db *sql.DB
	q  *sqlc.Queries
}

func New(db *sql.DB) *Service { return &Service{db: db, q: sqlc.New(db)} }

func (s *Service) Create(ctx context.Context, userID uint64, dto internal.CreateOrderDTO) (int64, error) {
	if !dto.DeliveryTime.After(time.Now()) {
		return 0, internal.ErrDeliveryTime
	}
	result, err := s.q.CreateOrder(ctx, sqlc.CreateOrderParams{
		UserID: userID, PickupLocation: dto.PickupLocation, DropoffLocation: dto.DropoffLocation,
		PackageDetails: dto.PackageDetails, DeliveryTime: dto.DeliveryTime.UTC(),
	})
	if err != nil {
		return 0, err
	}
	rows, err := result.RowsAffected()
	if err = checkRows(rows, err, "the order could not be created"); err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (s *Service) UserOrders(ctx context.Context, userID uint64) ([]internal.OrderDTO, error) {
	rows, err := s.q.GetUserOrders(ctx, userID)
	return internal.MapOrders(rows), err
}

func (s *Service) UserOrder(ctx context.Context, orderID, userID uint64) (internal.OrderDTO, error) {
	row, err := s.q.GetUserOrderByID(ctx, sqlc.GetUserOrderByIDParams{OrderID: orderID, UserID: userID})
	return internal.MapOrder(row), orderError(err)
}

func (s *Service) AllOrders(ctx context.Context) ([]internal.OrderDTO, error) {
	rows, err := s.q.GetAllOrders(ctx)
	return internal.MapOrders(rows), err
}

func (s *Service) Order(ctx context.Context, id uint64) (internal.OrderDTO, error) {
	row, err := s.q.GetOrderByID(ctx, id)
	return internal.MapOrder(row), orderError(err)
}

func (s *Service) History(ctx context.Context, orderID, userID uint64) ([]internal.HistoryDTO, error) {
	// A zero user ID is used only by the admin handler after role authentication.
	if userID != 0 {
		if _, err := s.UserOrder(ctx, orderID, userID); err != nil {
			return nil, err
		}
	} else if _, err := s.Order(ctx, orderID); err != nil {
		return nil, err
	}
	rows, err := s.q.GetOrderStatusHistory(ctx, orderID)
	if err != nil {
		return nil, err
	}
	out := make([]internal.HistoryDTO, 0, len(rows))
	for _, r := range rows {
		dto := internal.HistoryDTO{ID: r.ID, OrderID: r.OrderID, NewStatus: r.NewStatus, CreatedAt: r.CreatedAt, ChangedByName: r.ChangedByName, ChangedByRole: string(r.ChangedByRole)}
		if r.OldStatus.Valid {
			dto.OldStatus = &r.OldStatus.String
		}
		out = append(out, dto)
	}
	return out, nil
}

func (s *Service) Delete(ctx context.Context, id uint64) error {
	rows, err := s.q.DeleteOrder(ctx, id)
	if err != nil {
		return err
	}
	if rows != 1 {
		return internal.ErrNotFound
	}
	return nil
}

func (s *Service) Assignments(ctx context.Context, id uint64) ([]internal.AssignmentDTO, error) {
	if _, err := s.Order(ctx, id); err != nil {
		return nil, err
	}
	rows, err := s.q.GetOrderCourierAssignments(ctx, id)
	if err != nil {
		return nil, err
	}
	out := make([]internal.AssignmentDTO, 0, len(rows))
	for _, r := range rows {
		dto := internal.AssignmentDTO{ID: r.ID, OrderID: r.OrderID, CourierID: r.CourierID, Status: string(r.AssignmentStatus), CourierName: r.CourierName, CourierPhone: r.CourierPhone, AssignedAt: r.AssignedAt}
		if r.RespondedAt.Valid {
			dto.RespondedAt = &r.RespondedAt.Time
		}
		out = append(out, dto)
	}
	return out, nil
}

func orderError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return internal.ErrNotFound
	}
	return err
}
