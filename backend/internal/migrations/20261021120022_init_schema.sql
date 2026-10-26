-- +goose Up

CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'courier', 'admin') NOT NULL DEFAULT 'user',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role)
);

CREATE TABLE orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    courier_id BIGINT UNSIGNED NULL,

    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    package_details TEXT NOT NULL,
    delivery_time DATETIME NOT NULL,

    status ENUM(
        'pending',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_orders_user (user_id),
    INDEX idx_orders_courier (courier_id),
    INDEX idx_orders_status (status),

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_orders_courier
        FOREIGN KEY (courier_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE courier_assignments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    courier_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'pending',
        'accepted',
        'declined',
        'reassigned'
    ) NOT NULL DEFAULT 'pending',

    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_assignments_order (order_id),
    INDEX idx_assignments_courier (courier_id),
    INDEX idx_assignments_courier_status (courier_id, status),

    CONSTRAINT fk_assignments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignments_courier
        FOREIGN KEY (courier_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

CREATE TABLE order_status_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    changed_by BIGINT UNSIGNED NOT NULL,

    old_status VARCHAR(32) NULL,
    new_status VARCHAR(32) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    INDEX idx_status_history_order (order_id),

    CONSTRAINT fk_status_history_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_status_history_user
        FOREIGN KEY (changed_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- +goose Down

DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS courier_assignments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS users;
