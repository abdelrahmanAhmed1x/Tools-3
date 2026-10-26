package internal

import (
	"context"
	"errors"

	"github.com/abdelrahmanAhmed1x/core/httpx"
	"github.com/gin-gonic/gin"
	"tools/internal/modules/auth"
)

// Each handler depends only on the service operations it uses.
type UserService interface {
	Create(context.Context, uint64, CreateOrderDTO) (int64, error)
	UserOrders(context.Context, uint64) ([]OrderDTO, error)
	UserOrder(context.Context, uint64, uint64) (OrderDTO, error)
	Cancel(context.Context, uint64, uint64) error
	History(context.Context, uint64, uint64) ([]HistoryDTO, error)
}

type AdminService interface {
	AllOrders(context.Context) ([]OrderDTO, error)
	Order(context.Context, uint64) (OrderDTO, error)
	UpdateStatus(context.Context, uint64, uint64, string) error
	Delete(context.Context, uint64) error
	AssignCourier(context.Context, uint64, uint64) error
	Assignments(context.Context, uint64) ([]AssignmentDTO, error)
	History(context.Context, uint64, uint64) ([]HistoryDTO, error)
}

type Authenticator interface {
	Payload(*gin.Context) (auth.TokenPayload, bool)
}

type UserHandler struct {
	service UserService
	auth    Authenticator
}
type AdminHandler struct {
	service AdminService
	auth    Authenticator
}

func NewUserHandler(service UserService, auth Authenticator) *UserHandler {
	return &UserHandler{service: service, auth: auth}
}
func NewAdminHandler(service AdminService, auth Authenticator) *AdminHandler {
	return &AdminHandler{service: service, auth: auth}
}

type orderURI struct {
	ID uint64 `uri:"id" binding:"required,gt=0"`
}

func orderID(c *gin.Context) (uint64, bool) {
	dto, ok := httpx.BindURI[orderURI](c)
	return dto.ID, ok
}

func actorID(c *gin.Context, auth Authenticator) (uint64, bool) {
	payload, ok := auth.Payload(c)
	if !ok || payload.ID <= 0 {
		httpx.AbortUnauthorized(c, "authentication required")
		return 0, false
	}
	return uint64(payload.ID), true
}

func respondError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrNotFound), errors.Is(err, ErrCourierNotFound):
		httpx.AbortNotFound(c, err.Error())
	case errors.Is(err, ErrConflict):
		httpx.AbortConflict(c, err.Error(), nil)
	case errors.Is(err, ErrDeliveryTime):
		httpx.AbortBadRequest(c, err.Error(), nil)
	default:
		httpx.AbortInternal(c, err)
	}
}

func (h *UserHandler) Create(c *gin.Context) {
	dto, ok := httpx.BindJSON[CreateOrderDTO](c)
	if !ok {
		return
	}
	userID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	id, err := h.service.Create(c.Request.Context(), userID, dto)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.Created(c, gin.H{"id": id})
}

func (h *UserHandler) List(c *gin.Context) {
	userID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	orders, err := h.service.UserOrders(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, orders)
}

func (h *UserHandler) Get(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	userID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	order, err := h.service.UserOrder(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, order)
}

func (h *UserHandler) Cancel(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	userID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	if err := h.service.Cancel(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"status": "cancelled"})
}

func (h *UserHandler) History(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	userID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	history, err := h.service.History(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, history)
}

func (h *AdminHandler) List(c *gin.Context) {
	orders, err := h.service.AllOrders(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, orders)
}

func (h *AdminHandler) Get(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	order, err := h.service.Order(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, order)
}

func (h *AdminHandler) UpdateStatus(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	dto, ok := httpx.BindJSON[StatusDTO](c)
	if !ok {
		return
	}
	adminID, ok := actorID(c, h.auth)
	if !ok {
		return
	}
	if err := h.service.UpdateStatus(c.Request.Context(), id, adminID, dto.Status); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"status": dto.Status})
}

func (h *AdminHandler) Delete(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		respondError(c, err)
		return
	}
	httpx.NoContent(c)
}

func (h *AdminHandler) AssignCourier(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	dto, ok := httpx.BindJSON[AssignCourierDTO](c)
	if !ok {
		return
	}
	if err := h.service.AssignCourier(c.Request.Context(), id, dto.CourierID); err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, gin.H{"courier_id": dto.CourierID})
}

func (h *AdminHandler) Assignments(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	assignments, err := h.service.Assignments(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, assignments)
}

func (h *AdminHandler) History(c *gin.Context) {
	id, ok := orderID(c)
	if !ok {
		return
	}
	history, err := h.service.History(c.Request.Context(), id, 0)
	if err != nil {
		respondError(c, err)
		return
	}
	httpx.OK(c, history)
}
