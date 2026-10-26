package internal

import (
	"context"
	"errors"

	"github.com/abdelrahmanAhmed1x/core/httpx"
	"github.com/gin-gonic/gin"
	"tools/internal/modules/auth"
)

type CourierService interface {
	Orders(context.Context, uint64) ([]AssignmentDTO, error)
	Accept(context.Context, uint64, uint64) error
	Decline(context.Context, uint64, uint64) error
	UpdateStatus(context.Context, uint64, uint64, string) error
}

type Authenticator interface {
	Payload(*gin.Context) (auth.TokenPayload, bool)
}

type Handler struct {
	service CourierService
	auth    Authenticator
}

func NewHandler(service CourierService, auth Authenticator) *Handler {
	return &Handler{service: service, auth: auth}
}

type orderURI struct {
	ID uint64 `uri:"id" binding:"required,gt=0"`
}

func (h *Handler) courierID(c *gin.Context) (uint64, bool) {
	payload, ok := h.auth.Payload(c)
	if !ok || payload.ID <= 0 {
		httpx.AbortUnauthorized(c, "authentication required")
		return 0, false
	}
	return uint64(payload.ID), true
}

func respondError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound):
		httpx.AbortNotFound(c, err.Error())
	case errors.Is(err, ErrConflict):
		httpx.AbortConflict(c, err.Error(), nil)
	default:
		httpx.AbortInternal(c, err)
	}
}

func (h *Handler) Orders(c *gin.Context) {
	courierID, ok := h.courierID(c)
	if !ok {
		return
	}
	orders, err := h.service.Orders(c.Request.Context(), courierID)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, orders)
}

func (h *Handler) Accept(c *gin.Context) {
	dto, ok := httpx.BindURI[orderURI](c)
	if !ok {
		return
	}
	courierID, ok := h.courierID(c)
	if !ok {
		return
	}
	if err := h.service.Accept(c.Request.Context(), dto.ID, courierID); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"assignment_status": "accepted"})
}

func (h *Handler) Decline(c *gin.Context) {
	dto, ok := httpx.BindURI[orderURI](c)
	if !ok {
		return
	}
	courierID, ok := h.courierID(c)
	if !ok {
		return
	}
	if err := h.service.Decline(c.Request.Context(), dto.ID, courierID); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"assignment_status": "declined"})
}

func (h *Handler) UpdateStatus(c *gin.Context) {
	uri, ok := httpx.BindURI[orderURI](c)
	if !ok {
		return
	}
	dto, ok := httpx.BindJSON[StatusDTO](c)
	if !ok {
		return
	}
	courierID, ok := h.courierID(c)
	if !ok {
		return
	}
	if err := h.service.UpdateStatus(c.Request.Context(), uri.ID, courierID, dto.Status); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"status": dto.Status})
}

// CouriersService supplies the admin handler with the courier directory.
type CouriersService interface {
	Couriers(context.Context) ([]CourierDTO, error)
}

type AdminHandler struct{ service CouriersService }

func NewAdminHandler(service CouriersService) *AdminHandler { return &AdminHandler{service: service} }
func (h *AdminHandler) Couriers(c *gin.Context) {
	couriers, err := h.service.Couriers(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, couriers)
}
