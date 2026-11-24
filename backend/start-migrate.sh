#!/bin/sh
set -eu

database_password=$(cat "${DATABASE_PASSWORD_FILE:?DATABASE_PASSWORD_FILE must be set}")
export GOOSE_DBSTRING="${DATABASE_USER:?DATABASE_USER must be set}:${database_password}@tcp(${DATABASE_HOST:-mysql}:${DATABASE_PORT:-3306})/${DATABASE_NAME:?DATABASE_NAME must be set}?parseTime=true"
unset database_password

exec goose "$@"
