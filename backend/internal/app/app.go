package app

import (
	"context"
	"database/sql"
	"fmt"
)

type App struct {
	Config *Config
	DB     *sql.DB
	Server *Server
}

func NewApp() (*App, error) {
	cfg, err := NewConfig()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	db, err := Connection(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect database: %w", err)
	}

	app := &App{
		Config: cfg,
		DB:     db,
	}

	app.Server = NewServer(cfg, db)

	return app, nil
}

func (a *App) Run() error {
	return a.Server.Start()
}

func (a *App) Shutdown(ctx context.Context) error {
	defer a.DB.Close()

	return a.Server.Shutdown(ctx)
}