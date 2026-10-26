package internal

import "github.com/gin-gonic/gin"

func (h *Handler) RegisterRoutes(router gin.IRouter, authentication, requireCourier gin.HandlerFunc) {
	routes := router.Group("/courier", authentication, requireCourier)
	routes.GET("/orders", h.Orders)
	routes.PATCH("/orders/:id/accept", h.Accept)
	routes.PATCH("/orders/:id/decline", h.Decline)
	routes.PATCH("/orders/:id/status", h.UpdateStatus)
}

func (h *AdminHandler) RegisterRoutes(router gin.IRouter, authentication, requireAdmin gin.HandlerFunc) {
	routes := router.Group("/admin", authentication, requireAdmin)
	routes.GET("/couriers", h.Couriers)
}
