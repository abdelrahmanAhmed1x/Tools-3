#!/bin/sh
set -eu

database_password=$(cat "${DATABASE_PASSWORD_FILE:?DATABASE_PASSWORD_FILE must be set}")
export DATABASE_URL="${DATABASE_USER:?DATABASE_USER must be set}:${database_password}@tcp(${DATABASE_HOST:-mysql}:${DATABASE_PORT:-3306})/${DATABASE_NAME:?DATABASE_NAME must be set}?parseTime=true"
unset database_password

attempt=1
until GOOSE_DRIVER=mysql \
    GOOSE_DBSTRING="${DATABASE_URL:?DATABASE_URL must be set}" \
    GOOSE_MIGRATION_DIR=/app/migrations \
    goose up
do
    if [ "$attempt" -ge 30 ]; then
        echo "database was not ready after 30 attempts" >&2
        exit 1
    fi
    attempt=$((attempt + 1))
    sleep 2
done

exec tools-api "$@"
