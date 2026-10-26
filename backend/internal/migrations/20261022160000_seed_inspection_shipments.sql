-- +goose Up
-- Local inspection fixtures. Every demo account uses Assignment123!.
-- Depends on the previous demo-account migration. IDs are resolved by email.
-- Relative UTC times keep unfinished deliveries actionable whenever this runs.
SET @inspection_seed_time = UTC_TIMESTAMP();

INSERT INTO users (name, email, phone, password_hash, role)
VALUES
    ('Maya Hassan', 'customer1@tracking.test', '01000000006', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'user'),
    ('Omar Nabil', 'customer2@tracking.test', '01000000007', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'user')
ON DUPLICATE KEY UPDATE email = users.email;

SET @inspection_customer1 = (SELECT id FROM users WHERE email = 'customer1@tracking.test');
SET @inspection_customer2 = (SELECT id FROM users WHERE email = 'customer2@tracking.test');
SET @inspection_admin1 = (SELECT id FROM users WHERE email = 'admin1@tracking.test');
SET @inspection_courier1 = (SELECT id FROM users WHERE email = 'courier1@tracking.test');
SET @inspection_courier2 = (SELECT id FROM users WHERE email = 'courier2@tracking.test');
SET @inspection_courier3 = (SELECT id FROM users WHERE email = 'courier3@tracking.test');

-- Demo 01: pending.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, NULL, '18 Talaat Harb Street, Downtown Cairo', '24 Ahmed Orabi Street, Mohandessin', 'Ceramic coffee set. Fragile; keep upright. (Inspection demo 01)', DATE_ADD(@inspection_seed_time, INTERVAL 25 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 4 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 4 HOUR), INTERVAL 0 MINUTE));
SET @inspection_order_01 = LAST_INSERT_ID();

-- Demo 02: pending.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, NULL, '7 El Hegaz Street, Heliopolis', '42 Street 9, Maadi', 'Three books in a padded envelope. (Inspection demo 02)', DATE_ADD(@inspection_seed_time, INTERVAL 26 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 6 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 6 HOUR), INTERVAL 0 MINUTE));
SET @inspection_order_02 = LAST_INSERT_ID();

-- Demo 03: pending.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier1, '15 Abbas El Akkad Street, Nasr City', '9 El Merghany Street, Heliopolis', 'Running shoes, boxed. Call before arrival. (Inspection demo 03)', DATE_ADD(@inspection_seed_time, INTERVAL 27 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 8 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 8 HOUR), INTERVAL 30 MINUTE));
SET @inspection_order_03 = LAST_INSERT_ID();

-- Demo 04: pending.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier2, '28 Mostafa El Nahas Street, Nasr City', '11 El Tahrir Street, Dokki', 'Sealed document folder. Keep dry. (Inspection demo 04)', DATE_ADD(@inspection_seed_time, INTERVAL 28 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 10 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 10 HOUR), INTERVAL 30 MINUTE));
SET @inspection_order_04 = LAST_INSERT_ID();

-- Demo 05: pending.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier3, '6 Road 254, Degla Maadi', '19 Corniche El Nil, Garden City', 'Small desk lamp. Handle with care. (Inspection demo 05)', DATE_ADD(@inspection_seed_time, INTERVAL 29 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 12 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 12 HOUR), INTERVAL 30 MINUTE));
SET @inspection_order_05 = LAST_INSERT_ID();

-- Demo 06: pending; declined assignment, ready for reassignment.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, NULL, '31 Faisal Street, Giza', '8 Sudan Street, Dokki', 'Cotton linens in a reusable delivery bag. (Inspection demo 06)', DATE_ADD(@inspection_seed_time, INTERVAL 30 HOUR), 'pending', DATE_SUB(@inspection_seed_time, INTERVAL 14 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 14 HOUR), INTERVAL 60 MINUTE));
SET @inspection_order_06 = LAST_INSERT_ID();

-- Demo 07: picked_up.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier1, '12 El Nozha Street, Heliopolis', '35 Makram Ebeid Street, Nasr City', 'Laptop stand and keyboard. Two items. (Inspection demo 07)', DATE_ADD(@inspection_seed_time, INTERVAL 31 HOUR), 'picked_up', DATE_SUB(@inspection_seed_time, INTERVAL 16 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 16 HOUR), INTERVAL 120 MINUTE));
SET @inspection_order_07 = LAST_INSERT_ID();

-- Demo 08: picked_up.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier2, '23 Road 9, Maadi', '4 El Batal Ahmed Abdel Aziz Street, Dokki', 'Art prints in a protective tube. Do not bend. (Inspection demo 08)', DATE_ADD(@inspection_seed_time, INTERVAL 32 HOUR), 'picked_up', DATE_SUB(@inspection_seed_time, INTERVAL 18 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 18 HOUR), INTERVAL 120 MINUTE));
SET @inspection_order_08 = LAST_INSERT_ID();

-- Demo 09: in_transit; reassigned from courier three to courier one.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier1, '10 Ramses Street, Downtown Cairo', '22 Lebanon Street, Mohandessin', 'Camera accessories. Padded parcel; keep sealed. (Inspection demo 09)', DATE_ADD(@inspection_seed_time, INTERVAL 33 HOUR), 'in_transit', DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 240 MINUTE));
SET @inspection_order_09 = LAST_INSERT_ID();

-- Demo 10: in_transit.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier3, '17 El Nasr Road, New Cairo', '5 Ahmed Fakhry Street, Nasr City', 'Two board games. Medium carton. (Inspection demo 10)', DATE_ADD(@inspection_seed_time, INTERVAL 34 HOUR), 'in_transit', DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), INTERVAL 240 MINUTE));
SET @inspection_order_10 = LAST_INSERT_ID();

-- Demo 11: delivered.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer2, @inspection_courier2, '8 El Zamalek Street, Zamalek', '16 El Mesaha Square, Dokki', 'Handmade notebook gift set. (Inspection demo 11)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 720 MINUTE), 'delivered', DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_11 = LAST_INSERT_ID();

-- Demo 12: delivered.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, @inspection_courier1, '27 El Khalifa El Maamoun Street, Heliopolis', '13 El Thawra Street, Heliopolis', 'Cotton tote bags. Five pieces. (Inspection demo 12)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 720 MINUTE), 'delivered', DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_12 = LAST_INSERT_ID();

-- Demo 13: delivered.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer2, @inspection_courier3, '34 Street 90, New Cairo', '12 El Rehab Avenue, New Cairo', 'Kitchen storage containers. Small carton. (Inspection demo 13)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 720 MINUTE), 'delivered', DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_13 = LAST_INSERT_ID();

-- Demo 14: cancelled.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer1, NULL, '21 Qasr El Aini Street, Cairo', '6 El Nil Street, Giza', 'Stationery order. Cancelled by customer before pickup. (Inspection demo 14)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 30 HOUR), INTERVAL 720 MINUTE), 'cancelled', DATE_SUB(@inspection_seed_time, INTERVAL 30 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 30 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_14 = LAST_INSERT_ID();

-- Demo 15: cancelled.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer2, NULL, '9 El Gomhoria Street, Cairo', '38 King Faisal Street, Giza', 'Office supplies. Cancelled by operations before assignment. (Inspection demo 15)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 32 HOUR), INTERVAL 720 MINUTE), 'cancelled', DATE_SUB(@inspection_seed_time, INTERVAL 32 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 32 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_15 = LAST_INSERT_ID();

-- Demo 16: cancelled.
INSERT INTO orders (user_id, courier_id, pickup_location, dropoff_location, package_details, delivery_time, status, created_at, updated_at)
VALUES (@inspection_customer2, @inspection_courier2, '14 El Obour Street, Nasr City', '20 El Marghany Street, Heliopolis', 'Gift hamper. Cancelled by operations after courier acceptance. (Inspection demo 16)', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), INTERVAL 720 MINUTE), 'cancelled', DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), INTERVAL 360 MINUTE));
SET @inspection_order_16 = LAST_INSERT_ID();

-- Pending invitations, accepted routes, one decline, and a reassignment trail.
INSERT INTO courier_assignments (order_id, courier_id, status, assigned_at, responded_at)
VALUES
    (@inspection_order_03, @inspection_courier1, 'pending', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 8 HOUR), INTERVAL 30 MINUTE), NULL),
    (@inspection_order_04, @inspection_courier2, 'pending', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 10 HOUR), INTERVAL 30 MINUTE), NULL),
    (@inspection_order_05, @inspection_courier3, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 12 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 12 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_06, @inspection_courier2, 'declined', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 14 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 14 HOUR), INTERVAL 60 MINUTE)),
    (@inspection_order_07, @inspection_courier1, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 16 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 16 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_08, @inspection_courier2, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 18 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 18 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_09, @inspection_courier3, 'reassigned', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 60 MINUTE)),
    (@inspection_order_09, @inspection_courier1, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 60 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 90 MINUTE)),
    (@inspection_order_10, @inspection_courier3, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_11, @inspection_courier2, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_12, @inspection_courier1, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_13, @inspection_courier3, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 45 MINUTE)),
    (@inspection_order_16, @inspection_courier2, 'accepted', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), INTERVAL 45 MINUTE));

-- History follows the same forward-only transitions enforced by the API.
INSERT INTO order_status_history (order_id, changed_by, old_status, new_status, created_at)
VALUES
    (@inspection_order_07, @inspection_courier1, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 16 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_08, @inspection_courier2, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 18 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_09, @inspection_courier1, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_09, @inspection_courier1, 'picked_up', 'in_transit', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 20 HOUR), INTERVAL 240 MINUTE)),
    (@inspection_order_10, @inspection_courier3, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_10, @inspection_courier3, 'picked_up', 'in_transit', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 22 HOUR), INTERVAL 240 MINUTE)),
    (@inspection_order_11, @inspection_courier2, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_11, @inspection_courier2, 'picked_up', 'in_transit', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 240 MINUTE)),
    (@inspection_order_11, @inspection_courier2, 'in_transit', 'delivered', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 24 HOUR), INTERVAL 360 MINUTE)),
    (@inspection_order_12, @inspection_courier1, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_12, @inspection_courier1, 'picked_up', 'in_transit', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 240 MINUTE)),
    (@inspection_order_12, @inspection_courier1, 'in_transit', 'delivered', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 26 HOUR), INTERVAL 360 MINUTE)),
    (@inspection_order_13, @inspection_courier3, 'pending', 'picked_up', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 120 MINUTE)),
    (@inspection_order_13, @inspection_courier3, 'picked_up', 'in_transit', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 240 MINUTE)),
    (@inspection_order_13, @inspection_courier3, 'in_transit', 'delivered', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 28 HOUR), INTERVAL 360 MINUTE)),
    (@inspection_order_14, @inspection_customer1, 'pending', 'cancelled', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 30 HOUR), INTERVAL 360 MINUTE)),
    (@inspection_order_15, @inspection_admin1, 'pending', 'cancelled', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 32 HOUR), INTERVAL 360 MINUTE)),
    (@inspection_order_16, @inspection_admin1, 'pending', 'cancelled', DATE_ADD(DATE_SUB(@inspection_seed_time, INTERVAL 34 HOUR), INTERVAL 360 MINUTE));

-- +goose Down
-- Delete only marked fixtures owned by the inspection customers.
-- Child assignment/history rows are removed by the existing cascading FKs.
DELETE FROM orders
WHERE user_id IN (SELECT id FROM users WHERE email IN ('customer1@tracking.test', 'customer2@tracking.test'))
  AND package_details IN (
      'Ceramic coffee set. Fragile; keep upright. (Inspection demo 01)',
      'Three books in a padded envelope. (Inspection demo 02)',
      'Running shoes, boxed. Call before arrival. (Inspection demo 03)',
      'Sealed document folder. Keep dry. (Inspection demo 04)',
      'Small desk lamp. Handle with care. (Inspection demo 05)',
      'Cotton linens in a reusable delivery bag. (Inspection demo 06)',
      'Laptop stand and keyboard. Two items. (Inspection demo 07)',
      'Art prints in a protective tube. Do not bend. (Inspection demo 08)',
      'Camera accessories. Padded parcel; keep sealed. (Inspection demo 09)',
      'Two board games. Medium carton. (Inspection demo 10)',
      'Handmade notebook gift set. (Inspection demo 11)',
      'Cotton tote bags. Five pieces. (Inspection demo 12)',
      'Kitchen storage containers. Small carton. (Inspection demo 13)',
      'Stationery order. Cancelled by customer before pickup. (Inspection demo 14)',
      'Office supplies. Cancelled by operations before assignment. (Inspection demo 15)',
      'Gift hamper. Cancelled by operations after courier acceptance. (Inspection demo 16)'
  );

-- Keep demo customers if inspection created additional shipments or history.
DELETE FROM users
WHERE email IN ('customer1@tracking.test', 'customer2@tracking.test')
  AND role = 'user'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE orders.user_id = users.id OR orders.courier_id = users.id)
  AND NOT EXISTS (SELECT 1 FROM order_status_history WHERE order_status_history.changed_by = users.id)
  AND NOT EXISTS (SELECT 1 FROM courier_assignments WHERE courier_assignments.courier_id = users.id);
