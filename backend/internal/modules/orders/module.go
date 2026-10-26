package orders

import (
	"database/sql"

	"github.com/gin-gonic/gin"
	auth "tools/internal/modules/auth"
	"tools/internal/modules/orders/internal"
	"tools/internal/modules/orders/internal/service"
)

type Authentication interface {
	Authentication() gin.HandlerFunc
	RequireRoles(...auth.Role) gin.HandlerFunc
	Payload(*gin.Context) (auth.TokenPayload, bool)
}

type OrdersModule struct {
	auth  Authentication
	user  *internal.UserHandler
	admin *internal.AdminHandler
}

func New(db *sql.DB, auth Authentication) *OrdersModule {
	svc := service.New(db)
	return &OrdersModule{auth: auth, user: internal.NewUserHandler(svc, auth), admin: internal.NewAdminHandler(svc, auth)}
}

func (m *OrdersModule) RegisterRoutes(router gin.IRouter) {
	m.user.RegisterRoutes(router, m.auth.Authentication(), m.auth.RequireRoles(auth.User))
	m.admin.RegisterRoutes(router, m.auth.Authentication(), m.auth.RequireRoles(auth.Admin))
}
