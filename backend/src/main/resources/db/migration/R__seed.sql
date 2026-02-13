/*
Byte Me — Seed data (Flyway repeatable migration)

Provides reference data, test users, postings, reservations, and forecasting data.
All inserts use ON CONFLICT DO NOTHING for idempotency.

Test credentials (all use password "password123"):
- seller1@byteme.test / seller2@byteme.test (SELLER role)
- orgadmin1@byteme.test (ORG_ADMIN role)
- consumer1@byteme.test (ORG_ADMIN role, for second org)
*/

-- 1) Reference data

INSERT INTO category (category_id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bakery'),
  ('22222222-2222-2222-2222-222222222222', 'Hot Meals'),
  ('33333333-3333-3333-3333-333333333333', 'Produce'),
  ('44444444-4444-4444-4444-444444444444', 'Dairy')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pickup_window (window_id, label, start_time, end_time) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '07:00-09:00', '07:00', '09:00'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '12:00-14:00', '12:00', '14:00'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '17:00-18:00', '17:00', '18:00'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '18:00-19:30', '18:00', '19:30')
ON CONFLICT (label) DO NOTHING;

INSERT INTO badge (badge_id, code, name, description) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'FIRST_RESCUE', 'First Rescue', 'Completed your first collection.'),
  ('b2222222-2222-2222-2222-222222222222', 'STREAK_4', '4 Week Streak', 'Collected at least once per week for 4 weeks.'),
  ('b3333333-3333-3333-3333-333333333333', 'CO2_SAVER', 'CO2 Saver', 'Hit a milestone of CO2e saved.')
ON CONFLICT (code) DO NOTHING;

-- 2) User accounts (password = "password123" bcrypt hashed)

INSERT INTO user_account (user_id, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'seller1@byteme.test',
   '$2a$10$sPWYMTdumdKYGt9uNpSY3OD3pmHGfYRH7s/2RTUvCIpwLiOLR9jZm', 'SELLER'),
  ('00000000-0000-0000-0000-000000000002', 'seller2@byteme.test',
   '$2a$10$sPWYMTdumdKYGt9uNpSY3OD3pmHGfYRH7s/2RTUvCIpwLiOLR9jZm', 'SELLER'),
  ('00000000-0000-0000-0000-000000000011', 'orgadmin1@byteme.test',
   '$2a$10$sPWYMTdumdKYGt9uNpSY3OD3pmHGfYRH7s/2RTUvCIpwLiOLR9jZm', 'ORG_ADMIN'),
  ('00000000-0000-0000-0000-000000000012', 'consumer1@byteme.test',
   '$2a$10$sPWYMTdumdKYGt9uNpSY3OD3pmHGfYRH7s/2RTUvCIpwLiOLR9jZm', 'ORG_ADMIN')
ON CONFLICT (user_id) DO NOTHING;

-- 3) Sellers + Organisations

INSERT INTO seller (seller_id, user_id, name, location_text, opening_hours_text, contact_stub)
VALUES
  ('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Sourdough & Co', 'Exeter High St', 'Mon-Sat 07:00-18:00', 'hello@sourdough.test'),
  ('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002',
   'Campus Canteen', 'Streatham Campus', 'Mon-Fri 11:00-19:00', 'canteen@campus.test')
ON CONFLICT (seller_id) DO NOTHING;

INSERT INTO organisation (org_id, user_id, name, location_text, billing_email)
VALUES
  ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011',
   'St Petes Shelter', 'Exeter', 'finance@stpetes.test'),
  ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012',
   'Community Fridge', 'Exeter', 'billing@fridge.test')
ON CONFLICT (org_id) DO NOTHING;

INSERT INTO organisation_streak_cache (org_id, current_streak_weeks, best_streak_weeks, last_rescue_week_start)
VALUES
  ('70000000-0000-0000-0000-000000000001', 2, 3, date_trunc('week', now())::date - 7),
  ('70000000-0000-0000-0000-000000000002', 1, 1, date_trunc('week', now())::date)
ON CONFLICT (org_id) DO NOTHING;

INSERT INTO organisation_badge (org_id, badge_id)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111'),
  ('70000000-0000-0000-0000-000000000001', 'b3333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- 3B) Bad seeds (should fail due to role check triggers)

-- BAD: seller pointing at ORG_ADMIN role
DO $$
BEGIN
  INSERT INTO seller (seller_id, user_id, name)
  VALUES ('80000000-0000-0000-0000-00000000bad1', '00000000-0000-0000-0000-000000000012', 'Wrong Role Seller');
  RAISE NOTICE '[BAD seed] seller role-check unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] seller role-check rejected: %', SQLERRM;
END $$;

-- BAD: organisation pointing at SELLER role
DO $$
BEGIN
  INSERT INTO organisation (org_id, user_id, name)
  VALUES ('70000000-0000-0000-0000-00000000bad2', '00000000-0000-0000-0000-000000000001', 'Wrong Role Org');
  RAISE NOTICE '[BAD seed] organisation role-check unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] organisation role-check rejected: %', SQLERRM;
END $$;

-- 4) Bundle postings

INSERT INTO bundle_posting (
  posting_id, seller_id, category_id, window_id,
  title, description, allergens_text,
  pickup_start_at, pickup_end_at,
  quantity_total, quantity_reserved,
  price_cents, discount_pct, estimated_weight_grams,
  status
) VALUES
  -- Seller 1 / Bakery / 17-18
  ('60000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   'Mixed Bakery Bag','Surplus bread + pastries. Usually 8-12 items.','gluten, dairy, eggs',
   date_trunc('week', now()) + interval '8 days' + time '17:00',
   date_trunc('week', now()) + interval '8 days' + time '18:00',
   18, 0, 350, 40, 2500, 'ACTIVE'),

  -- Seller 1 / Produce / 12-14
  ('60000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
   'Veg Box','Mixed veg and fruit. Great for soup prep.','',
   date_trunc('week', now()) + interval '9 days' + time '12:00',
   date_trunc('week', now()) + interval '9 days' + time '14:00',
   12, 0, 300, 25, 4000, 'ACTIVE'),

  -- Seller 1 / Dairy / 07-09
  ('60000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
   'Dairy Rescue Pack','Yoghurts + milk nearing date.','dairy',
   date_trunc('week', now()) + interval '10 days' + time '07:00',
   date_trunc('week', now()) + interval '10 days' + time '09:00',
   10, 0, 250, 20, 3500, 'ACTIVE'),

  -- Seller 2 / Hot Meals / 18-19:30
  ('60000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   'Hot Meal Boxes','End-of-service meal boxes. Changes daily.','may contain nuts, gluten',
   date_trunc('week', now()) + interval '8 days' + time '18:00',
   date_trunc('week', now()) + interval '8 days' + time '19:30',
   25, 0, 500, 30, 6000, 'ACTIVE'),

  -- Seller 2 / Hot Meals / 12-14 (lunch)
  ('60000000-0000-0000-0000-000000000005','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
   'Lunch Meal Boxes','Lunch leftovers. Usually lighter meals.','may contain nuts, gluten',
   date_trunc('week', now()) + interval '9 days' + time '12:00',
   date_trunc('week', now()) + interval '9 days' + time '14:00',
   16, 0, 450, 15, 5000, 'ACTIVE'),

  -- A DRAFT posting (should not be reservable)
  ('60000000-0000-0000-0000-000000000006','80000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   'Draft Bakery Bag','Not live yet.','gluten',
   date_trunc('week', now()) + interval '11 days' + time '17:00',
   date_trunc('week', now()) + interval '11 days' + time '18:00',
   8, 0, 300, 10, 1500, 'DRAFT')
ON CONFLICT (posting_id) DO NOTHING;

-- 4B) Bad posting seeds

-- BAD: pickup_end_at <= pickup_start_at
DO $$
BEGIN
  INSERT INTO bundle_posting (
    posting_id, seller_id, category_id, window_id,
    title, pickup_start_at, pickup_end_at,
    quantity_total, price_cents, discount_pct, status
  ) VALUES (
    '60000000-0000-0000-0000-00000000bad3',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Bad Pickup Window',
    now() + interval '10 days',
    now() + interval '10 days' - interval '1 hour',
    5, 200, 10, 'ACTIVE'
  );
  RAISE NOTICE '[BAD seed] bundle_posting pickup order unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] bundle_posting pickup order rejected: %', SQLERRM;
END $$;

-- BAD: discount out of range
DO $$
BEGIN
  INSERT INTO bundle_posting (
    posting_id, seller_id, category_id, window_id,
    title, pickup_start_at, pickup_end_at,
    quantity_total, price_cents, discount_pct, status
  ) VALUES (
    '60000000-0000-0000-0000-00000000bad4',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Bad Discount',
    now() + interval '12 days',
    now() + interval '12 days' + interval '1 hour',
    5, 200, 999, 'ACTIVE'
  );
  RAISE NOTICE '[BAD seed] bundle_posting discount unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] bundle_posting discount rejected: %', SQLERRM;
END $$;

-- 5) Reservations

INSERT INTO reservation (
  reservation_id, posting_id, org_id, reserved_by_user_id,
  status, claim_code_hash, claim_code_last4
) VALUES
  ('50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',
   'RESERVED', crypt('BYTE-1234-AAAA', gen_salt('bf')), 'AAAA'),
  ('50000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012',
   'RESERVED', crypt('BYTE-5678-BBBB', gen_salt('bf')), 'BBBB'),
  ('50000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011',
   'RESERVED', crypt('BYTE-9999-CCCC', gen_salt('bf')), 'CCCC'),
  ('50000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000012',
   'RESERVED', crypt('BYTE-0000-DDDD', gen_salt('bf')), 'DDDD')
ON CONFLICT (reservation_id) DO NOTHING;

-- Mark one as collected
UPDATE reservation
SET status = 'COLLECTED', collected_at = now() - interval '2 days'
WHERE reservation_id = '50000000-0000-0000-0000-000000000001'
  AND status = 'RESERVED';

INSERT INTO reservation_status_history (history_id, reservation_id, changed_by_user_id, old_status, new_status)
VALUES ('51000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','RESERVED','COLLECTED')
ON CONFLICT (history_id) DO NOTHING;

INSERT INTO rescue_event (event_id, org_id, reservation_id, collected_at, meals_estimate, co2e_estimate_grams)
VALUES ('40000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
  now() - interval '2 days', 10, 4200)
ON CONFLICT (event_id) DO NOTHING;

-- Cancel one (tests decrement trigger)
UPDATE reservation
SET status = 'CANCELLED', cancelled_at = now() - interval '1 day'
WHERE reservation_id = '50000000-0000-0000-0000-000000000002'
  AND status = 'RESERVED';

INSERT INTO reservation_status_history (history_id, reservation_id, changed_by_user_id, old_status, new_status)
VALUES ('51000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000011','RESERVED','CANCELLED')
ON CONFLICT (history_id) DO NOTHING;

-- 5B) Bad reservation seeds

-- BAD: reserve a DRAFT posting
DO $$
BEGIN
  INSERT INTO reservation (
    reservation_id, posting_id, org_id, reserved_by_user_id,
    status, claim_code_hash, claim_code_last4
  ) VALUES (
    '50000000-0000-0000-0000-00000000bad5',
    '60000000-0000-0000-0000-000000000006',
    '70000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'RESERVED',
    crypt('BYTE-BAD-DRAFT', gen_salt('bf')),
    'RAFT'
  );
  RAISE NOTICE '[BAD seed] reservation on DRAFT unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] reservation on DRAFT rejected: %', SQLERRM;
END $$;

-- BAD: rescue_event without COLLECTED reservation
DO $$
BEGIN
  INSERT INTO rescue_event (event_id, org_id, reservation_id, meals_estimate, co2e_estimate_grams)
  VALUES ('40000000-0000-0000-0000-00000000bad6','70000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003',5,2000);
  RAISE NOTICE '[BAD seed] rescue_event without collected unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] rescue_event requires collected rejected: %', SQLERRM;
END $$;

-- Oversell test: tiny posting
INSERT INTO bundle_posting (
  posting_id, seller_id, category_id, window_id,
  title, pickup_start_at, pickup_end_at,
  quantity_total, price_cents, discount_pct, status
) VALUES (
  '60000000-0000-0000-0000-000000000007',
  '80000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
  'Tiny Test Posting',
  date_trunc('week', now()) + interval '12 days' + time '17:00',
  date_trunc('week', now()) + interval '12 days' + time '18:00',
  1, 150, 10, 'ACTIVE'
)
ON CONFLICT (posting_id) DO NOTHING;

INSERT INTO reservation (
  reservation_id, posting_id, org_id, reserved_by_user_id,
  status, claim_code_hash, claim_code_last4
) VALUES (
  '50000000-0000-0000-0000-000000000008',
  '60000000-0000-0000-0000-000000000007',
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000011',
  'RESERVED',
  crypt('BYTE-TINY-1111', gen_salt('bf')),
  '1111'
)
ON CONFLICT (reservation_id) DO NOTHING;

-- BAD: second reservation should fail (sold out)
DO $$
BEGIN
  INSERT INTO reservation (
    reservation_id, posting_id, org_id, reserved_by_user_id,
    status, claim_code_hash, claim_code_last4
  ) VALUES (
    '50000000-0000-0000-0000-00000000bad7',
    '60000000-0000-0000-0000-000000000007',
    '70000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000012',
    'RESERVED',
    crypt('BYTE-TINY-2222', gen_salt('bf')),
    '2222'
  );
  RAISE NOTICE '[BAD seed] oversell unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] oversell rejected: %', SQLERRM;
END $$;

-- 6) Forecasting: demand observations (12 weeks)

-- Seller 1: Bakery, 17-18, discount 40
INSERT INTO demand_observation (
  obs_id, seller_id, category_id, window_id,
  date, day_of_week, discount_pct, weather_flag,
  observed_reservations, observed_no_show_rate
) VALUES
  ('d0000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 84), EXTRACT(ISODOW FROM (current_date - 84))::int, 40, true,  8, 0.20),
  ('d0000000-0000-0000-0000-000000000002','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 77), EXTRACT(ISODOW FROM (current_date - 77))::int, 40, false, 10, 0.15),
  ('d0000000-0000-0000-0000-000000000003','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 70), EXTRACT(ISODOW FROM (current_date - 70))::int, 40, true,  9, 0.19),
  ('d0000000-0000-0000-0000-000000000004','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 63), EXTRACT(ISODOW FROM (current_date - 63))::int, 40, false, 11, 0.14),
  ('d0000000-0000-0000-0000-000000000005','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 56), EXTRACT(ISODOW FROM (current_date - 56))::int, 40, false, 12, 0.13),
  ('d0000000-0000-0000-0000-000000000006','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 49), EXTRACT(ISODOW FROM (current_date - 49))::int, 40, true,  10, 0.17),
  ('d0000000-0000-0000-0000-000000000007','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 42), EXTRACT(ISODOW FROM (current_date - 42))::int, 40, false, 13, 0.12),
  ('d0000000-0000-0000-0000-000000000008','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 35), EXTRACT(ISODOW FROM (current_date - 35))::int, 40, false, 14, 0.11),
  ('d0000000-0000-0000-0000-000000000009','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 28), EXTRACT(ISODOW FROM (current_date - 28))::int, 40, true,  12, 0.15),
  ('d0000000-0000-0000-0000-000000000010','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 21), EXTRACT(ISODOW FROM (current_date - 21))::int, 40, false, 15, 0.10),
  ('d0000000-0000-0000-0000-000000000011','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 14), EXTRACT(ISODOW FROM (current_date - 14))::int, 40, false, 16, 0.09),
  ('d0000000-0000-0000-0000-000000000012','80000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
   (current_date - 7),  EXTRACT(ISODOW FROM (current_date - 7))::int,  40, false, 17, 0.08)
ON CONFLICT DO NOTHING;

-- Seller 2: Hot meals, 18-19:30, discount 30
INSERT INTO demand_observation (
  obs_id, seller_id, category_id, window_id,
  date, day_of_week, discount_pct, weather_flag,
  observed_reservations, observed_no_show_rate
) VALUES
  ('d0000000-0000-0000-0000-000000000101','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 84), EXTRACT(ISODOW FROM (current_date - 84))::int, 30, true,  13, 0.32),
  ('d0000000-0000-0000-0000-000000000102','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 77), EXTRACT(ISODOW FROM (current_date - 77))::int, 30, false, 16, 0.25),
  ('d0000000-0000-0000-0000-000000000103','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 70), EXTRACT(ISODOW FROM (current_date - 70))::int, 30, true,  14, 0.30),
  ('d0000000-0000-0000-0000-000000000104','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 63), EXTRACT(ISODOW FROM (current_date - 63))::int, 30, false, 17, 0.24),
  ('d0000000-0000-0000-0000-000000000105','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 56), EXTRACT(ISODOW FROM (current_date - 56))::int, 30, false, 19, 0.22),
  ('d0000000-0000-0000-0000-000000000106','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 49), EXTRACT(ISODOW FROM (current_date - 49))::int, 30, true,  16, 0.28),
  ('d0000000-0000-0000-0000-000000000107','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 42), EXTRACT(ISODOW FROM (current_date - 42))::int, 30, false, 20, 0.20),
  ('d0000000-0000-0000-0000-000000000108','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 35), EXTRACT(ISODOW FROM (current_date - 35))::int, 30, false, 21, 0.19),
  ('d0000000-0000-0000-0000-000000000109','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 28), EXTRACT(ISODOW FROM (current_date - 28))::int, 30, true,  18, 0.26),
  ('d0000000-0000-0000-0000-000000000110','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 21), EXTRACT(ISODOW FROM (current_date - 21))::int, 30, false, 22, 0.18),
  ('d0000000-0000-0000-0000-000000000111','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 14), EXTRACT(ISODOW FROM (current_date - 14))::int, 30, false, 23, 0.17),
  ('d0000000-0000-0000-0000-000000000112','80000000-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
   (current_date - 7),  EXTRACT(ISODOW FROM (current_date - 7))::int,  30, false, 24, 0.16)
ON CONFLICT DO NOTHING;

-- BAD: day_of_week out of range
DO $$
BEGIN
  INSERT INTO demand_observation (
    obs_id, seller_id, category_id, window_id,
    date, day_of_week, discount_pct, weather_flag,
    observed_reservations, observed_no_show_rate
  ) VALUES (
    'd0000000-0000-0000-0000-00000000bad8',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    current_date - 3, 9, 40, false, 10, 0.12
  );
  RAISE NOTICE '[BAD seed] demand_observation bad day_of_week unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] demand_observation bad day_of_week rejected: %', SQLERRM;
END $$;

-- 7) Forecast runs + outputs

INSERT INTO forecast_run (
  run_id, model_name, params_json, train_start, train_end, eval_start, eval_end, metrics_json
) VALUES
  ('f0000000-0000-0000-0000-000000000001','baseline_moving_average_4w',
   '{"window_weeks":4,"target":"observed_reservations"}',
   current_date - 84, current_date - 15,
   current_date - 14, current_date - 1,
   '{"MAE_reservations":1.9,"RMSE_reservations":2.4,"Brier_no_show":0.078}'),
  ('f0000000-0000-0000-0000-000000000002','baseline_seasonal_naive_isodow',
   '{"season":"isodow","target":"observed_reservations"}',
   current_date - 84, current_date - 15,
   current_date - 14, current_date - 1,
   '{"MAE_reservations":1.6,"RMSE_reservations":2.1,"Brier_no_show":0.074}'),
  ('f0000000-0000-0000-0000-000000000003','chosen_poisson_glm_plus_no_show_logit',
   '{"features":["isodow","window_id","seller_id","category_id","weather_flag","discount_pct"],"regularization":"l2"}',
   current_date - 84, current_date - 15,
   current_date - 14, current_date - 1,
   '{"MAE_reservations":1.2,"RMSE_reservations":1.7,"Brier_no_show":0.061}')
ON CONFLICT (run_id) DO NOTHING;

INSERT INTO forecast_output (
  output_id, run_id, posting_id,
  predicted_reservations, predicted_no_show_prob, confidence, rationale_text
) VALUES
  ('fa000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001',
   12.3, 0.14, 0.74,
   'Uses seller+window+day-of-week history (12 weeks). Tuesday 17:00-18:00 is trending up. Weather=false + 40% discount boosts demand. Recommend post ~12 (not 18) to avoid leftovers; confidence moderate (limited history).'),
  ('fa000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002',
   20.2, 0.21, 0.70,
   'Hot meals show higher no-show rates in 18:00-19:30. With 30% discount and Weather=false demand is strong but no-shows ~0.2. Recommend post 20-21 (not 25) unless reminders/shorter window; confidence moderate.'),
  ('fa000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000003',
   7.4, 0.10, 0.62,
   'Produce at lunchtime sells steadily. Low no-show historically. Recommend post 7-8 bundles; confidence ok.'),
  ('fa000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000004',
   6.1, 0.08, 0.58,
   'Early dairy pickups have lower demand. Recommend smaller quantity or higher discount; confidence medium-low.')
ON CONFLICT (output_id) DO NOTHING;

-- Baseline outputs for comparison
INSERT INTO forecast_output (
  output_id, run_id, posting_id,
  predicted_reservations, predicted_no_show_prob, confidence, rationale_text
) VALUES
  ('fa000000-0000-0000-0000-000000000101','f0000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',
   11.5, 0.15, 0.55,'Moving average (4w) on same seller/category/window. No-show prob = recent mean.'),
  ('fa000000-0000-0000-0000-000000000102','f0000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001',
   14.0, 0.12, 0.52,'Seasonal naive: last value for same ISO day-of-week bucket. No-show prob = last observed.')
ON CONFLICT (output_id) DO NOTHING;

-- BAD: forecast_output pointing at missing posting_id
DO $$
BEGIN
  INSERT INTO forecast_output (
    output_id, run_id, posting_id,
    predicted_reservations, predicted_no_show_prob, confidence, rationale_text
  ) VALUES (
    'fa000000-0000-0000-0000-00000000bad9',
    'f0000000-0000-0000-0000-000000000003',
    '66666666-6666-6666-6666-666666666666',
    10.0, 0.1, 0.5, 'Should fail FK.'
  );
  RAISE NOTICE '[BAD seed] forecast_output FK unexpectedly inserted.';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] forecast_output FK rejected: %', SQLERRM;
END $$;

-- 8) Seller weekly metrics

INSERT INTO seller_metrics_weekly (
  seller_id, week_start,
  posted_count, reserved_count, collected_count, no_show_count, expired_count,
  sell_through_rate, waste_avoided_grams
) VALUES
  ('80000000-0000-0000-0000-000000000001', date_trunc('week', now())::date - 14, 3, 22, 18, 2, 2, 0.82, 12000),
  ('80000000-0000-0000-0000-000000000001', date_trunc('week', now())::date - 7,  3, 25, 21, 1, 3, 0.84, 13500),
  ('80000000-0000-0000-0000-000000000002', date_trunc('week', now())::date - 14, 3, 30, 24, 4, 2, 0.80, 21000),
  ('80000000-0000-0000-0000-000000000002', date_trunc('week', now())::date - 7,  3, 33, 27, 3, 3, 0.82, 22500)
ON CONFLICT DO NOTHING;
