-- name: CreateOrder :execresult
INSERT INTO orders (
    user_id,
    pickup_location,
    dropoff_location,
    package_details,
    delivery_time
)
VALUES (
    sqlc.arg('userID'),
    sqlc.arg('pickupLocation'),
    sqlc.arg('dropoffLocation'),
    sqlc.arg('packageDetails'),
    sqlc.arg('deliveryTime')
);


-- name: GetUserOrders :many
SELECT *
FROM order_details
WHERE user_id = sqlc.arg('userID')
ORDER BY created_at DESC;


-- name: GetUserOrderByID :one
SELECT *
FROM order_details
WHERE id = sqlc.arg('orderID')
  AND user_id = sqlc.arg('userID');


-- name: GetAllOrders :many
SELECT *
FROM order_details
ORDER BY created_at DESC;


-- name: GetOrderByID :one
SELECT *
FROM order_details
WHERE id = sqlc.arg('orderID');


-- name: GetOrderForUpdate :one
SELECT
    id,
    user_id,
    courier_id,
    status
FROM orders
WHERE id = sqlc.arg('orderID')
FOR UPDATE;


-- name: CancelPendingOrder :execrows
UPDATE orders
SET status = 'cancelled'
WHERE id = sqlc.arg('orderID')
  AND user_id = sqlc.arg('userID')
  AND status = 'pending';


-- name: UpdateOrderStatus :execrows
UPDATE orders
SET status = sqlc.arg('newStatus')
WHERE id = sqlc.arg('orderID')
  AND status = sqlc.arg('expectedStatus');

-- name: UpdateCourierOrderStatus :execrows
  UPDATE orders AS o
  SET o.status = sqlc.arg('newStatus')
  WHERE o.id = sqlc.arg('orderID')
    AND o.courier_id = sqlc.arg('courierID')
    AND o.status = sqlc.arg('expectedStatus')
    AND EXISTS (
        SELECT 1
        FROM courier_assignments AS ca
        WHERE ca.order_id = o.id
          AND ca.courier_id = o.courier_id
          AND ca.status = 'accepted'
    );


-- name: DeleteOrder :execrows
DELETE FROM orders
WHERE id = sqlc.arg('orderID');


-- name: CreateOrderStatusHistory :execrows
INSERT INTO order_status_history (
    order_id,
    changed_by,
    old_status,
    new_status
)
VALUES (
    sqlc.arg('orderID'),
    sqlc.arg('changedBy'),
    sqlc.arg('oldStatus'),
    sqlc.arg('newStatus')
);


-- name: GetOrderStatusHistory :many
SELECT
    h.id,
    h.order_id,
    h.old_status,
    h.new_status,
    h.created_at,
    u.name AS changed_by_name,
    u.role AS changed_by_role
FROM order_status_history h
JOIN users u ON u.id = h.changed_by
WHERE h.order_id = sqlc.arg('orderID')
ORDER BY h.created_at ASC, h.id ASC;
