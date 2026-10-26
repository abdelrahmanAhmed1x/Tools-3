package internal

import (
	"errors"
	"time"
)

var (
	ErrNotFound = errors.New("assigned order not found")
	ErrConflict = errors.New("assignment or order conflict")
)

type StatusDTO struct {
	Status string `json:"status" binding:"required,oneof=picked_up in_transit delivered"`
}

type AssignmentDTO struct {
	ID               uint64     `json:"id"`
	OrderID          uint64     `json:"order_id"`
	CourierID        uint64     `json:"courier_id"`
	AssignmentStatus string     `json:"assignment_status"`
	AssignedAt       time.Time  `json:"assigned_at"`
	RespondedAt      *time.Time `json:"responded_at"`
	CourierName      string     `json:"courier_name"`
	CourierPhone     string     `json:"courier_phone"`
	UserID           uint64     `json:"user_id"`
	PickupLocation   string     `json:"pickup_location"`
	DropoffLocation  string     `json:"dropoff_location"`
	PackageDetails   string     `json:"package_details"`
	DeliveryTime     time.Time  `json:"delivery_time"`
	OrderStatus      string     `json:"order_status"`
	CustomerName     string     `json:"customer_name"`
	CustomerPhone    string     `json:"customer_phone"`
}

type CourierDTO struct {
	ID    uint64 `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}
