package internal

import (
	"errors"
	"time"
)

var (
	ErrNotFound        = errors.New("order not found")
	ErrConflict        = errors.New("order conflict")
	ErrCourierNotFound = errors.New("courier not found")
	ErrDeliveryTime    = errors.New("delivery_time must be in the future")
)

type CreateOrderDTO struct {
	PickupLocation  string    `json:"pickup_location" binding:"required"`
	DropoffLocation string    `json:"dropoff_location" binding:"required"`
	PackageDetails  string    `json:"package_details" binding:"required"`
	DeliveryTime    time.Time `json:"delivery_time" binding:"required"`
}

type StatusDTO struct {
	Status string `json:"status" binding:"required,oneof=pending picked_up in_transit delivered cancelled"`
}

type AssignCourierDTO struct {
	CourierID uint64 `json:"courier_id" binding:"required,gt=0"`
}

type OrderDTO struct {
	ID              uint64    `json:"id"`
	UserID          uint64    `json:"user_id"`
	CourierID       *int64    `json:"courier_id"`
	PickupLocation  string    `json:"pickup_location"`
	DropoffLocation string    `json:"dropoff_location"`
	PackageDetails  string    `json:"package_details"`
	DeliveryTime    time.Time `json:"delivery_time"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	CustomerName    string    `json:"customer_name"`
	CustomerEmail   string    `json:"customer_email"`
	CustomerPhone   string    `json:"customer_phone"`
	CourierName     *string   `json:"courier_name"`
	CourierEmail    *string   `json:"courier_email"`
	CourierPhone    *string   `json:"courier_phone"`
}

type HistoryDTO struct {
	ID            uint64    `json:"id"`
	OrderID       uint64    `json:"order_id"`
	OldStatus     *string   `json:"old_status"`
	NewStatus     string    `json:"new_status"`
	CreatedAt     time.Time `json:"created_at"`
	ChangedByName string    `json:"changed_by_name"`
	ChangedByRole string    `json:"changed_by_role"`
}

type AssignmentDTO struct {
	ID           uint64     `json:"id"`
	OrderID      uint64     `json:"order_id"`
	CourierID    uint64     `json:"courier_id"`
	Status       string     `json:"assignment_status"`
	CourierName  string     `json:"courier_name"`
	CourierPhone string     `json:"courier_phone"`
	AssignedAt   time.Time  `json:"assigned_at"`
	RespondedAt  *time.Time `json:"responded_at"`
}
