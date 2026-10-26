package internal

import "github.com/gin-gonic/gin"

func (h *Handler) RegisterRoutes(router gin.IRouter, authentication gin.HandlerFunc) {
	routes := router.Group("/auth")
	routes.POST("/register", h.Register)
	routes.POST("/login", h.Login)
	routes.POST("/logout", authentication, h.Logout)
	routes.GET("/me", authentication, h.Me)
}
