package app

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/abdelrahmanAhmed1x/core/auth/single"
	"github.com/abdelrahmanAhmed1x/core/auth/transport"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"tools/internal/modules/auth"
	"tools/internal/modules/courier"
	"tools/internal/modules/orders"
)

type Server struct {
	engine *gin.Engine
	http   *http.Server
}

func NewServer(cfg *Config, db *sql.DB) *Server {
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	allowedOrigins := []string{
		fmt.Sprintf("http://localhost:%d", cfg.Port),
		fmt.Sprintf("http://127.0.0.1:%d", cfg.Port),
	}
	allowedOrigins = append(allowedOrigins, cfg.FrontendOrigins...)
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowCredentials: true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		MaxAge:           12 * time.Hour,
	}))

	cookie := transport.Normalize(transport.Config{
		CookieName:          "session",
		InsecureDevelopment: true,
		AllowedOrigins:      allowedOrigins,
	})
	manager := single.New[auth.TokenPayload](single.Config{SecretKey: cfg.JWTSecret, Issuer: "tools", Audience: "tools-api", TTL: auth.DefaultTTL, Transport: cookie})
	authModule := auth.New(db, manager, cookie, auth.DefaultTTL)
	// Preserve existing auth paths while exposing the versioned API.
	authModule.RegisterRoutes(router)
	api := router.Group("/api/v1")
	authModule.RegisterRoutes(api)
	orders.New(db, authModule).RegisterRoutes(api)
	courier.New(db, authModule).RegisterRoutes(api)

	router.GET("/health", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	server := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	return &Server{
		engine: router,
		http:   server,
	}
}

func (s *Server) Start() error {
	if err := s.http.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		return fmt.Errorf("start server: %w", err)
	}

	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.http.Shutdown(ctx)
}
