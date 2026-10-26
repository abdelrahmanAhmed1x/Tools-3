package internal

import "tools/internal/modules/courier/internal/sqlc"

func MapAssignment(r sqlc.CourierAssignmentDetail) AssignmentDTO {
	dto := AssignmentDTO{
		ID: r.ID, OrderID: r.OrderID, CourierID: r.CourierID, AssignmentStatus: string(r.AssignmentStatus),
		AssignedAt: r.AssignedAt, CourierName: r.CourierName, CourierPhone: r.CourierPhone,
		UserID: r.UserID, PickupLocation: r.PickupLocation, DropoffLocation: r.DropoffLocation,
		PackageDetails: r.PackageDetails, DeliveryTime: r.DeliveryTime, OrderStatus: string(r.OrderStatus),
		CustomerName: r.CustomerName, CustomerPhone: r.CustomerPhone,
	}
	if r.RespondedAt.Valid {
		dto.RespondedAt = &r.RespondedAt.Time
	}
	return dto
}
