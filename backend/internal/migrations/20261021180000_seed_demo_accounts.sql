-- +goose Up
-- Assignment demo accounts. Password for every account: Assignment123!
-- Passwords use bcrypt's default cost (10), matching the authentication service.
INSERT INTO users (name, email, phone, password_hash, role)
VALUES
    ('Demo Admin One', 'admin1@tracking.test', '01000000001', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'admin'),
    ('Demo Admin Two', 'admin2@tracking.test', '01000000002', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'admin'),
    ('Demo Courier One', 'courier1@tracking.test', '01000000003', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'courier'),
    ('Demo Courier Two', 'courier2@tracking.test', '01000000004', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'courier'),
    ('Demo Courier Three', 'courier3@tracking.test', '01000000005', '$2a$10$.aBiPlTUoEpRN/jqzKAwAuPlta45t7gP4Oj37ssHC4mXbtPA3ByKO', 'courier');

-- +goose Down
-- Existing foreign keys intentionally prevent removal of accounts still used
-- by orders, assignments, or status history. Remove demo orders first.
DELETE FROM users
WHERE (email IN ('admin1@tracking.test', 'admin2@tracking.test') AND role = 'admin')
   OR (email IN ('courier1@tracking.test', 'courier2@tracking.test', 'courier3@tracking.test') AND role = 'courier');
