package internal

import (
	"context"
	"errors"
	"time"

	"github.com/abdelrahmanAhmed1x/core/auth/transport"
	"github.com/abdelrahmanAhmed1x/core/httpx"
	"github.com/gin-gonic/gin"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailExists        = errors.New("email already registered")
	ErrUserNotFound       = errors.New("user not found")
)

type AuthService interface {
	Register(context.Context, CreateUserDTO) error
	Login(context.Context, LoginDTO) (LoginResponseDTO, error)
	Me(context.Context, uint64) (UserDTO, error)
}

// TokenManager is the token functionality consumed by the handlers.
type TokenManager interface {
	Issue(TokenPayload) (string, error)
	Payload(*gin.Context) (TokenPayload, bool)
}

type Handler struct {
	service AuthService
	manager TokenManager
	cookie  transport.Config
	ttl     time.Duration
}

func NewHandler(service AuthService, manager TokenManager, cookie transport.Config, ttl time.Duration) *Handler {
	return &Handler{service: service, manager: manager, cookie: cookie, ttl: ttl}
}

func (h *Handler) Register(c *gin.Context) {
	dto, ok := httpx.BindJSON[CreateUserDTO](c)
	if !ok {
		return
	}
	if err := h.service.Register(c.Request.Context(), dto); err != nil {
		if errors.Is(err, ErrEmailExists) {
			httpx.AbortConflict(c, ErrEmailExists.Error(), nil)
		} else {
			httpx.AbortInternal(c, err)
		}
		return
	}
	httpx.Created(c, gin.H{"message": "registered successfully"})
}

func (h *Handler) Login(c *gin.Context) {
	dto, ok := httpx.BindJSON[LoginDTO](c)
	if !ok {
		return
	}
	user, err := h.service.Login(c.Request.Context(), dto)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			httpx.AbortUnauthorized(c, ErrInvalidCredentials.Error())
		} else {
			httpx.AbortInternal(c, err)
		}
		return
	}
	token, err := h.manager.Issue(TokenPayload{ID: user.ID, Role: user.Role})
	if err != nil {
		httpx.AbortInternal(c, err)
		return
	}
	transport.SetCookie(c.Writer, h.cookie, token, h.ttl)
	httpx.OK(c, TokenResponseDTO{Token: token, User: user})
}

// Logout clears the browser cookie; single tokens remain valid until expiry.
func (h *Handler) Logout(c *gin.Context) {
	transport.SetCookie(c.Writer, h.cookie, "", 0)
	httpx.NoContent(c)
}

func (h *Handler) Me(c *gin.Context) {
	payload, ok := h.manager.Payload(c)
	if !ok {
		httpx.AbortUnauthorized(c, "authentication required")
		return
	}
	user, err := h.service.Me(c.Request.Context(), uint64(payload.ID))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			httpx.AbortNotFound(c, err.Error())
		} else {
			httpx.AbortInternal(c, err)
		}
		return
	}
	httpx.OK(c, user)
}
