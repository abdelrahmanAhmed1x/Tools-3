package app

import (
	"fmt"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
)

type Config struct {
	FrontendOrigins []string `env:"FRONTEND_ORIGINS" envDefault:"http://localhost:5173,http://127.0.0.1:5173"`
	DatabaseURL     string   `env:"DATABASE_URL,required"`
	Port            int      `env:"PORT" envDefault:"8082"`
	JWTSecret       string   `env:"JWT_SECRET,required"`
}

func NewConfig() (*Config, error) {
	_ = godotenv.Load()
	var cfg Config
	if err := env.Parse(&cfg); err != nil {
		return nil, fmt.Errorf("parse environment variables: %w", err)
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must contain at least 32 bytes")
	}
	return &cfg, nil
}
