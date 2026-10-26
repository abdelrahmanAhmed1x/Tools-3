package internal

import "tools/internal/modules/orders/internal/sqlc"

func MapOrder(row sqlc.OrderDetail) OrderDTO {
	dto := OrderDTO{
		ID: row.ID, UserID: row.UserID, PickupLocation: row.PickupLocation,
		DropoffLocation: row.DropoffLocation, PackageDetails: row.PackageDetails,
		DeliveryTime: row.DeliveryTime, Status: string(row.Status), CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt, CustomerName: row.CustomerName, CustomerEmail: row.CustomerEmail,
		CustomerPhone: row.CustomerPhone,
	}
	if row.CourierID.Valid {
		dto.CourierID = &row.CourierID.Int64
	}
	if row.CourierName.Valid {
		dto.CourierName = &row.CourierName.String
	}
	if row.CourierEmail.Valid {
		dto.CourierEmail = &row.CourierEmail.String
	}
	if row.CourierPhone.Valid {
		dto.CourierPhone = &row.CourierPhone.String
	}
	return dto
}

func MapOrders(rows []sqlc.OrderDetail) []OrderDTO {
	out := make([]OrderDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, MapOrder(row))
	}
	return out
}
