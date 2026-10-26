FROM docker.io/library/golang:1.27.1-alpine AS build
# Independent of API sources and SQL files so their changes do not recompile Goose.
RUN CGO_ENABLED=0 go install -trimpath -ldflags="-s -w" \
    -tags='no_clickhouse no_libsql no_mssql no_postgres no_sqlite3 no_vertica no_ydb' \
    github.com/pressly/goose/v3/cmd/goose@v3.28.0

FROM docker.io/library/alpine:3.23
RUN apk add --no-cache ca-certificates \
    && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /go/bin/goose /usr/local/bin/goose
COPY internal/migrations ./migrations
USER app
ENV GOOSE_DRIVER=mysql GOOSE_MIGRATION_DIR=/app/migrations
ENTRYPOINT ["/usr/local/bin/goose"]
CMD ["up"]
