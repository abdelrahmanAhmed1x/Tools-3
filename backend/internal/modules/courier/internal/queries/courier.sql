-- name: GetCourierAssignedOrders :many
SELECT *
FROM courier_assignment_details
WHERE courier_id = sqlc.arg('courierID')
  AND assignment_status IN ('pending', 'accepted')
ORDER BY assigned_at DESC, id DESC;


-- name: GetCourierAssignment :one
SELECT *
FROM courier_assignment_details
WHERE order_id = sqlc.arg('orderID')
  AND courier_id = sqlc.arg('courierID')
  AND assignment_status IN ('pending', 'accepted')
ORDER BY assigned_at DESC, id DESC
LIMIT 1;


-- name: GetOrderCourierAssignments :many
SELECT *
FROM courier_assignment_details
WHERE order_id = sqlc.arg('orderID')
ORDER BY assigned_at DESC, id DESC;


-- name: AcceptCourierAssignment :execrows
UPDATE courier_assignments
SET
    status = 'accepted',
    responded_at = CURRENT_TIMESTAMP
WHERE order_id = sqlc.arg('orderID')
  AND courier_id = sqlc.arg('courierID')
  AND status = 'pending';


-- name: DeclineCourierAssignment :execrows
UPDATE courier_assignments
SET
    status = 'declined',
    responded_at = CURRENT_TIMESTAMP
WHERE order_id = sqlc.arg('orderID')
  AND courier_id = sqlc.arg('courierID')
  AND status = 'pending';


-- name: ClearDeclinedOrderCourier :execrows
UPDATE orders
SET courier_id = NULL
WHERE id = sqlc.arg('orderID')
  AND courier_id = sqlc.arg('courierID')
  AND status = 'pending';


-- name: ReassignPreviousCourier :execrows
UPDATE courier_assignments
SET
    status = 'reassigned',
    responded_at = CURRENT_TIMESTAMP
WHERE order_id = sqlc.arg('orderID')
  AND status IN ('pending', 'accepted');


-- name: CreateCourierAssignment :execresult
INSERT INTO courier_assignments (
    order_id,
    courier_id,
    status
)
VALUES (
    sqlc.arg('orderID'),
    sqlc.arg('courierID'),
    'pending'
);


-- name: SetOrderCourier :execrows
UPDATE orders
SET courier_id = sqlc.arg('courierID')
WHERE id = sqlc.arg('orderID')
  AND status = 'pending';