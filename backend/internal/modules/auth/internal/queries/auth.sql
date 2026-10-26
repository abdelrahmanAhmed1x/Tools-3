-- name: CreateUser :execresult
INSERT INTO users (
    name,
    email,
    phone,
    password_hash
)
VALUES (
    sqlc.arg('name'),
    sqlc.arg('email'),
    sqlc.arg('phone'),
    sqlc.arg('passwordHash')
);


-- name: GetUserByEmail :one
SELECT
    id,
    name,
    email,
    phone,
    password_hash,
    role,
    created_at
FROM users
WHERE email = sqlc.arg('email');


-- name: GetUserByID :one
SELECT
    id,
    name,
    email,
    phone,
    role,
    created_at
FROM users
WHERE id = sqlc.arg('id');


-- name: GetCouriers :many
SELECT
    id,
    name,
    email,
    phone
FROM users
WHERE role = 'courier'
ORDER BY name, id;