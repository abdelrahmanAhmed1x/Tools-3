package internal

import "github.com/gin-gonic/gin"

func (h *UserHandler) RegisterRoutes(router gin.IRouter, authentication, requireUser gin.HandlerFunc) {
	routes := router.Group("/orders", authentication, requireUser)
	routes.POST("", h.Create)
	routes.GET("", h.List)
	routes.GET("/:id", h.Get)
	routes.PATCH("/:id/cancel", h.Cancel)
	routes.GET("/:id/history", h.History)
}

func (h *AdminHandler) RegisterRoutes(router gin.IRouter, authentication, requireAdmin gin.HandlerFunc) {
	routes := router.Group("/admin", authentication, requireAdmin)
	routes.GET("/orders", h.List)
	routes.GET("/orders/:id", h.Get)
	routes.PATCH("/orders/:id/status", h.UpdateStatus)
	routes.DELETE("/orders/:id", h.Delete)
	routes.PUT("/orders/:id/courier", h.AssignCourier)
	routes.GET("/orders/:id/assignments", h.Assignments)
	routes.GET("/orders/:id/history", h.History)
}
