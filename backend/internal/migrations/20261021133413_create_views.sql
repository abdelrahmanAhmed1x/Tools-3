-- +goose Up

CREATE VIEW order_details AS
SELECT
    o.id,
    o.user_id,
    o.courier_id,

    o.pickup_location,
    o.dropoff_location,
    o.package_details,
    o.delivery_time,
    o.status,
    o.created_at,
    o.updated_at,

    u.name AS customer_name,
    u.email AS customer_email,
    u.phone AS customer_phone,

    c.name AS courier_name,
    c.email AS courier_email,
    c.phone AS courier_phone

FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN users c ON c.id = o.courier_id;


CREATE VIEW courier_assignment_details AS
SELECT
    ca.id,
    ca.order_id,
    ca.courier_id,
    ca.status AS assignment_status,
    ca.assigned_at,
    ca.responded_at,

    c.name AS courier_name,
    c.phone AS courier_phone,

    o.user_id,
    o.pickup_location,
    o.dropoff_location,
    o.package_details,
    o.delivery_time,
    o.status AS order_status,

    u.name AS customer_name,
    u.phone AS customer_phone

FROM courier_assignments ca
JOIN orders o ON o.id = ca.order_id
JOIN users c ON c.id = ca.courier_id
JOIN users u ON u.id = o.user_id;


-- +goose Down

DROP VIEW IF EXISTS courier_assignment_details;
DROP VIEW IF EXISTS order_details;