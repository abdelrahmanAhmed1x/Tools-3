# Tools project — Podman Phase 2

This project runs as three containers: MySQL, the Go API, and the Vite frontend
served by nginx. Images are built locally as `localhost/tools-project-*`; all
database state is stored in the named `backend_mysql_data` Podman volume.

## Compose approach

Create the three Podman secrets once (values are entered on standard input and
are never stored in `.env`):

```bash
podman secret create tools_mysql_root_password -
podman secret create tools_mysql_password -
podman secret create tools_jwt_secret -
```

Copy `.env.example` to `.env` only for non-secret port, tag, or database-name
overrides, then start the application from this directory:

```bash
podman-compose up -d --build
```

Open http://localhost:5173 (or the configured `FRONTEND_PORT`).

The backend applies pending Goose migrations before starting the API. It retries
while MySQL initializes, which also supports older `podman-compose` releases.
A migration failure stops backend startup; inspect it with `podman-compose logs
backend`. The named MySQL volume remains intact across `podman-compose down`.

## Manual approach and Docker Hub

For the required non-Compose workflow, exact build/run/verify commands and
Docker Hub tagging instructions are in [docs/podman-manual.md](docs/podman-manual.md).
