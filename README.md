# Tools project

Start the application from this directory:

```bash
podman-compose up -d --build
```

Open http://localhost:5173 (or the configured `FRONTEND_PORT`).

MySQL starts first. The backend applies pending Goose migrations before starting
the API, and the frontend waits for the backend health check. A migration failure
stops backend startup; inspect it with `podman-compose logs backend`.

The separate migration CLI is available through the optional `tools` profile:

```bash
podman-compose --profile tools run --rm migrate status
```

When upgrading from the previous configuration, recreate the containers once to
remove their old dependencies on the completed migration container:

```bash
podman-compose --profile tools down
podman-compose up -d --build
```

These commands preserve the MySQL data volume.
