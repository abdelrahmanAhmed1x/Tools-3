# Podman deployment

This document covers both required approaches: Compose and manual Podman
commands. Use only one approach at a time because both publish the same host
ports and use the same persistent database volume.

## Compose deployment

Create the secrets once. Skip this step if they already exist:

```bash
printf '%s' 'your-strong-mysql-root-password' | podman secret create tools_mysql_root_password -
printf '%s' 'your-strong-mysql-app-password' | podman secret create tools_mysql_password -
printf '%s' 'a-jwt-secret-that-is-at-least-32-characters-long' | podman secret create tools_jwt_secret -
```

From the repository root, build and start all three services:

```bash
podman-compose up -d --build
podman-compose ps
```

Open `http://localhost:5173`. To inspect startup or stop the stack:

```bash
podman-compose logs -f backend
podman-compose down
```

`down` removes containers and the Compose network but preserves the named
`backend_mysql_data` volume and Podman secrets.

## Manual Podman deployment

Run these commands from the repository root. They intentionally use the same
image tags, secrets, ports, and named volume as `compose.yaml`.

If you have a `.env` with `MYSQL_DATABASE` or `MYSQL_USER` overrides, load it
before the commands so manual containers use the same database settings:

```bash
set -a; . ./.env; set +a
```

## One-time setup

```bash
podman secret create tools_mysql_root_password -
podman secret create tools_mysql_password -
podman secret create tools_jwt_secret -
podman volume create backend_mysql_data
podman network create tools-network
```

Enter a different strong value for each password prompt. The JWT secret must be
at least 32 bytes. Podman does not print secret values after creation.

## Build the three images

```bash
podman build -t localhost/tools-project-mysql:latest database
podman build -t localhost/tools-project-backend:latest backend
podman build -t localhost/tools-project-frontend:latest frontend
```

## Start each container

```bash
podman run -d --name tools-mysql --network tools-network --network-alias mysql \
  -p 127.0.0.1:3306:3306 -v backend_mysql_data:/var/lib/mysql \
  --secret tools_mysql_root_password,type=mount,target=tools_mysql_root_password \
  --secret tools_mysql_password,type=mount,target=tools_mysql_password \
  -e MYSQL_ROOT_PASSWORD_FILE=/run/secrets/tools_mysql_root_password \
  -e MYSQL_DATABASE="${MYSQL_DATABASE:-tools}" -e MYSQL_USER="${MYSQL_USER:-tools_app}" \
  -e MYSQL_PASSWORD_FILE=/run/secrets/tools_mysql_password \
  localhost/tools-project-mysql:latest

podman run -d --name tools-backend --network tools-network --network-alias backend \
  -p 127.0.0.1:8082:8082 \
  --secret tools_mysql_password,type=mount,target=tools_mysql_password \
  --secret tools_jwt_secret,type=mount,target=tools_jwt_secret \
  -e DATABASE_HOST=tools-mysql -e DATABASE_PORT=3306 \
  -e DATABASE_NAME="${MYSQL_DATABASE:-tools}" -e DATABASE_USER="${MYSQL_USER:-tools_app}" \
  -e DATABASE_PASSWORD_FILE=/run/secrets/tools_mysql_password \
  -e JWT_SECRET_FILE=/run/secrets/tools_jwt_secret \
  -e FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173 \
  localhost/tools-project-backend:latest

podman run -d --name tools-frontend --network tools-network \
  -p 127.0.0.1:5173:8080 localhost/tools-project-frontend:latest
```

Wait for MySQL to become ready before starting the backend (`podman logs
tools-mysql`). The backend migrates the schema at startup. Containers reach one
another only through `tools-network`; the frontend proxies `/api/` to `backend`.

## Verify and publish

```bash
podman ps
podman exec tools-backend wget -qO- http://127.0.0.1:8082/health
podman exec tools-frontend wget -qO- http://127.0.0.1:8080/healthz
podman login docker.io
podman tag localhost/tools-project-backend:latest docker.io/USER/tools-project-backend:latest
podman push docker.io/USER/tools-project-backend:latest
```

Repeat the last two image commands for `frontend` and `mysql`, replacing
`USER` with your Docker Hub namespace. Never put passwords in image tags,
Containerfiles, or shell history.
