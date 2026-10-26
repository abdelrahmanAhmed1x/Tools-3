package courier

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	 "tools/internal/modules/auth"
	"tools/internal/modules/courier/internal"
	"tools/internal/modules/courier/internal/service"
)

type Authentication interface {
	Authentication() gin.HandlerFunc
	RequireRoles(...auth.Role) gin.HandlerFunc
	Payload(*gin.Context) (auth.TokenPayload, bool)
}

type CourierModule struct {
	auth    Authentication
	handler *internal.Handler
	admin   *internal.AdminHandler
}

func New(db *sql.DB, auth Authentication) *CourierModule {
	svc := service.New(db)
	return &CourierModule{auth: auth, handler: internal.NewHandler(svc, auth), admin: internal.NewAdminHandler(svc)}
}
func (m *CourierModule) RegisterRoutes(router gin.IRouter) {
	m.handler.RegisterRoutes(router, m.auth.Authentication(), m.auth.RequireRoles(auth.Courier))
	m.admin.RegisterRoutes(router, m.auth.Authentication(), m.auth.RequireRoles(auth.Admin))
}
