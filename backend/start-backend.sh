#!/bin/sh
set -eu

# Apply pending migrations before the API can accept requests. A failed
# migration exits this container, so the frontend cannot start against it.
GOOSE_DRIVER=mysql \
GOOSE_DBSTRING="${DATABASE_URL:?DATABASE_URL must be set}" \
GOOSE_MIGRATION_DIR=/app/migrations \
    goose up

exec tools-api "$@"
