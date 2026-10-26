package auth

import (
	"database/sql"
	"time"

	"github.com/abdelrahmanAhmed1x/core/auth/transport"
	"github.com/abdelrahmanAhmed1x/core/authorization"
	"github.com/gin-gonic/gin"
	"tools/internal/modules/auth/internal"
	service "tools/internal/modules/auth/internal/service"
)

type Role = internal.Role
type TokenPayload = internal.TokenPayload

const (
	User       = internal.User
	Courier    = internal.Courier
	Admin      = internal.Admin
	DefaultTTL = 30 * 24 * time.Hour
)

// TokenManager is implemented by single.Manager and can be replaced by a fake.
type TokenManager interface {
	internal.TokenManager
	Middleware() gin.HandlerFunc
}

type AuthModule struct {
	manager    TokenManager
	authorizer *authorization.Authorizer
	handler    *internal.Handler
}

// New accepts the token manager used by authentication and login.
// The cookie settings and TTL must match the manager configuration.
func New(db *sql.DB, manager TokenManager, cookie transport.Config, ttl time.Duration) *AuthModule {
	if ttl == 0 {
		ttl = DefaultTTL
	}
	cookie = transport.Normalize(cookie)
	m := &AuthModule{manager: manager}
	m.authorizer = authorization.New(func(c *gin.Context) (authorization.Principal, error) {
		payload, ok := m.Payload(c)
		if !ok {
			return authorization.Principal{}, authorization.ErrUnauthenticated
		}
		return authorization.Principal{Roles: []string{string(payload.Role)}}, nil
	})
	m.handler = internal.NewHandler(service.New(db), manager, cookie, ttl)
	return m
}

func (m *AuthModule) Authentication() gin.HandlerFunc { return m.manager.Middleware() }

// RequireRoles allows any listed role. Use Authentication before this middleware.
func (m *AuthModule) RequireRoles(roles ...Role) gin.HandlerFunc {
	names := make([]string, len(roles))
	for i, role := range roles {
		names[i] = string(role)
	}
	return m.authorizer.RequireAnyRole(names...)
}

func (m *AuthModule) Payload(c *gin.Context) (TokenPayload, bool) {
	return m.manager.Payload(c)
}

func (m *AuthModule) RegisterRoutes(router gin.IRouter) {
	m.handler.RegisterRoutes(router, m.Authentication())
}
