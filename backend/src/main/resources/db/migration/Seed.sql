/*
Byte Me — Sprint 1 seed data

Everything else (sellers, orgs, postings, reservations, forecasting, triggers) stays basically the same,
just pointing at `app_user` and using stable UUIDs so screenshots/tests don’t drift.

What this seed gives you:
- Reference data: categories, pickup windows, badge definitions.
- Users: sellers, an org admin, a consumer (as an org user), and a maintainer (all in `app_user`).
- Multiple sellers + organisations with streak cache + a couple org badges.
- Multiple postings across categories/windows, including one DRAFT (to test rejection paths).
- Reservations covering: RESERVED, COLLECTED + rescue_event, CANCELLED, and oversell prevention.
- Forecasting seed: 12 weeks of demand history + a few forecast runs + outputs (plus baseline comparisons).
- Weekly seller metrics rows for dashboard screenshots.

Bad seeds (for tests):
- This file also includes a few INTENTIONALLY WRONG inserts (FK failures, role checks, invalid values).
- They’re wrapped in `DO $$ ... EXCEPTION ... END $$;` so the script keeps running,
  and you get a NOTICE showing the DB correctly rejected them.

How to use:
1) Create these auth users in Supabase:
   - seller1@byteme.test
   - seller2@byteme.test
   - orgadmin1@byteme.test
   - consumer1@byteme.test
   - maintainer@byteme.test
2) Copy their UUIDs into the “Auth user IDs” section (\set variables).
3) Run this file.
*/

-- 0) Auth user IDs
-- THIS HAS PLACE HOLDERS IT NEEDS auth.users IDs HERE

DO $$
BEGIN
  IF '00000000-0000-0000-0000-000000000001'::uuid IS NULL THEN NULL; END IF;
END $$;

-- Sellers
-- seller1@byteme.test
\set auth_seller_1 '00000000-0000-0000-0000-000000000001'
-- seller2@byteme.test
\set auth_seller_2 '00000000-0000-0000-0000-000000000002'

-- Orgs
-- orgadmin1@byteme.test
\set auth_org_admin_1 '00000000-0000-0000-0000-000000000011'
-- consumer1@byteme.test
\set auth_consumer_1  '00000000-0000-0000-0000-000000000012'

-- Maintainer
-- maintainer@byteme.test
\set auth_maintainer  '00000000-0000-0000-0000-000000000099'


-- 1) Reference data (GOOD)

INSERT INTO category (category_id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Bakery'),
  ('22222222-2222-2222-2222-222222222222', 'Hot Meals'),
  ('33333333-3333-3333-3333-333333333333', 'Produce'),
  ('44444444-4444-4444-4444-444444444444', 'Dairy')
ON CONFLICT (name) DO NOTHING;

INSERT INTO pickup_window (window_id, label, start_time, end_time) VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '07:00–09:00', '07:00', '09:00'),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '12:00–14:00', '12:00', '14:00'),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '17:00–18:00', '17:00', '18:00'),
  ('aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '18:00–19:30', '18:00', '19:30')
ON CONFLICT (label) DO NOTHING;

INSERT INTO badge (badge_id, code, name, description) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'FIRST_RESCUE', 'First Rescue', 'Completed your first collection.'),
  ('b2222222-2222-2222-2222-222222222222', 'STREAK_4', '4 Week Streak', 'Collected at least once per week for 4 weeks.'),
  ('b3333333-3333-3333-3333-333333333333', 'CO2_SAVER', 'CO₂ Saver', 'Hit a milestone of CO₂e saved.')
ON CONFLICT (code) DO NOTHING;


-- 2A) App users (GOOD)

INSERT INTO app_user (user_id, role) VALUES
  (:'auth_seller_1'::uuid, 'SELLER'),
  (:'auth_seller_2'::uuid, 'SELLER'),
  (:'auth_org_admin_1'::uuid, 'ORG_ADMIN'),
  (:'auth_consumer_1'::uuid, 'CONSUMER'),
  (:'auth_maintainer'::uuid, 'MAINTAINER')
ON CONFLICT (user_id) DO NOTHING;


-- 2B) App users (BAD seeds, should FAIL)

-- BAD: user not present in auth.users -> should fail FK
DO $$
BEGIN
  INSERT INTO app_user (user_id, role)
  VALUES ('99999999-9999-9999-9999-999999999999', 'SELLER');
  RAISE NOTICE '[BAD seed] app_user FK test unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] app_user FK rejected: %', SQLERRM;
END $$;


-- 3A) Sellers + Orgs (GOOD)

INSERT INTO seller (seller_id, user_id, name, location_text, opening_hours_text, contact_stub)
VALUES
  ('80000000-0000-0000-0000-000000000001', :'auth_seller_1'::uuid, 'Sourdough & Co', 'Exeter High St', 'Mon–Sat 07:00–18:00', 'hello@sourdough.test'),
  ('80000000-0000-0000-0000-000000000002', :'auth_seller_2'::uuid, 'Campus Canteen', 'Streatham Campus', 'Mon–Fri 11:00–19:00', 'canteen@campus.test')
ON CONFLICT (seller_id) DO NOTHING;

INSERT INTO organisation (org_id, user_id, name, location_text, billing_email)
VALUES
  ('70000000-0000-0000-0000-000000000001', :'auth_org_admin_1'::uuid, 'St Petes Shelter', 'Exeter', 'finance@stpetes.test'),
  ('70000000-0000-0000-0000-000000000002', :'auth_consumer_1'::uuid,  'Community Fridge', 'Exeter', 'billing@fridge.test')
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


-- 3B) Sellers + Orgs (BAD seeds, should FAIL)

-- BAD: seller pointing at a CONSUMER role -> your trigger should reject
DO $$
BEGIN
  INSERT INTO seller (seller_id, user_id, name)
  VALUES ('80000000-0000-0000-0000-00000000BAD1', :'auth_consumer_1'::uuid, 'Wrong Role Seller');
  RAISE NOTICE '[BAD seed] seller role-check unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] seller role-check rejected: %', SQLERRM;
END $$;

-- BAD: organisation pointing at SELLER role -> your trigger should reject
DO $$
BEGIN
  INSERT INTO organisation (org_id, user_id, name)
  VALUES ('70000000-0000-0000-0000-00000000BAD2', :'auth_seller_1'::uuid, 'Wrong Role Org');
  RAISE NOTICE '[BAD seed] organisation role-check unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] organisation role-check rejected: %', SQLERRM;
END $$;


-- 4A) Bundle postings (GOOD, more volume)

-- We create multiple postings across sellers/categories/windows.
-- Keep pickup windows in the future so reservation trigger doesn’t reject.
-- Using “next week” anchors keeps it stable relative to run date.

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
   'Mixed Bakery Bag','Surplus bread + pastries. Usually 8–12 items.','gluten, dairy, eggs',
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


-- 4B) Bundle postings (BAD seeds, should FAIL)

-- BAD: pickup_end_at <= pickup_start_at (violates chk_pickup_order)
DO $$
BEGIN
  INSERT INTO bundle_posting (
    posting_id, seller_id, category_id, window_id,
    title, pickup_start_at, pickup_end_at,
    quantity_total, price_cents, discount_pct, status
  ) VALUES (
    '60000000-0000-0000-0000-00000000BAD3',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Bad Pickup Window',
    now() + interval '10 days',
    now() + interval '10 days' - interval '1 hour',
    5, 200, 10, 'ACTIVE'
  );
  RAISE NOTICE '[BAD seed] bundle_posting pickup order unexpectedly inserted (should not happen).';
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
    '60000000-0000-0000-0000-00000000BAD4',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Bad Discount',
    now() + interval '12 days',
    now() + interval '12 days' + interval '1 hour',
    5, 200, 999, 'ACTIVE'
  );
  RAISE NOTICE '[BAD seed] bundle_posting discount unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] bundle_posting discount rejected: %', SQLERRM;
END $$;


-- 5) Reservations + status history + rescue events (GOOD)

-- GOOD reservations (should increment quantity_reserved)
INSERT INTO reservation (
  reservation_id, posting_id, org_id, reserved_by_user_id,
  status, claim_code_hash, claim_code_last4
) VALUES
  -- Reserved
  ('50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',:'auth_org_admin_1'::uuid,
   'RESERVED', crypt('BYTE-1234-AAAA', gen_salt('bf')), 'AAAA'),

  -- Will cancel later (tests decrement trigger)
  ('50000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000002',:'auth_consumer_1'::uuid,
   'RESERVED', crypt('BYTE-5678-BBBB', gen_salt('bf')), 'BBBB'),

  -- Another posting
  ('50000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',:'auth_org_admin_1'::uuid,
   'RESERVED', crypt('BYTE-9999-CCCC', gen_salt('bf')), 'CCCC'),

  -- A second org reserves produce
  ('50000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000002',:'auth_consumer_1'::uuid,
   'RESERVED', crypt('BYTE-0000-DDDD', gen_salt('bf')), 'DDDD')
ON CONFLICT (reservation_id) DO NOTHING;

-- Mark one as collected (this happens to create rescue_event)
UPDATE reservation
SET status = 'COLLECTED',
    collected_at = now() - interval '2 days'
WHERE reservation_id = '50000000-0000-0000-0000-000000000001'
  AND status = 'RESERVED';

INSERT INTO reservation_status_history (
  history_id, reservation_id, changed_by_user_id, old_status, new_status
) VALUES
  ('51000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',:'auth_maintainer'::uuid,'RESERVED','COLLECTED')
ON CONFLICT (history_id) DO NOTHING;

INSERT INTO rescue_event (event_id, org_id, reservation_id, collected_at, meals_estimate, co2e_estimate_grams)
VALUES
  ('40000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
   now() - interval '2 days', 10, 4200)
ON CONFLICT (event_id) DO NOTHING;

-- Cancel one (tests capacity decrement trigger)
UPDATE reservation
SET status = 'CANCELLED',
    cancelled_at = now() - interval '1 day'
WHERE reservation_id = '50000000-0000-0000-0000-000000000002'
  AND status = 'RESERVED';

INSERT INTO reservation_status_history (
  history_id, reservation_id, changed_by_user_id, old_status, new_status
) VALUES
  ('51000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002',:'auth_maintainer'::uuid,'RESERVED','CANCELLED')
ON CONFLICT (history_id) DO NOTHING;


-- 5B) Reservations / rescue events (BAD seeds, should FAIL)

-- BAD: try to reserve a DRAFT posting (trigger expects ACTIVE)
DO $$
BEGIN
  INSERT INTO reservation (
    reservation_id, posting_id, org_id, reserved_by_user_id,
    status, claim_code_hash, claim_code_last4
  ) VALUES (
    '50000000-0000-0000-0000-00000000BAD5',
    '60000000-0000-0000-0000-000000000006', -- DRAFT
    '70000000-0000-0000-0000-000000000001',
    :'auth_org_admin_1'::uuid,
    'RESERVED',
    crypt('BYTE-BAD-DRAFT', gen_salt('bf')),
    'RAFT'
  );
  RAISE NOTICE '[BAD seed] reservation on DRAFT unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] reservation on DRAFT rejected: %', SQLERRM;
END $$;

-- BAD: rescue_event without COLLECTED reservation (trigger should reject)
DO $$
BEGIN
  INSERT INTO rescue_event (event_id, org_id, reservation_id, meals_estimate, co2e_estimate_grams)
  VALUES ('40000000-0000-0000-0000-00000000BAD6','70000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003',5,2000);
  RAISE NOTICE '[BAD seed] rescue_event without collected unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] rescue_event requires collected rejected: %', SQLERRM;
END $$;

-- BAD: oversell test (try to insert > quantity_total reservations on a small posting)
-- Make a tiny posting first (GOOD), then attempt to over-reserve (BAD).
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

-- First reservation should succeed
INSERT INTO reservation (
  reservation_id, posting_id, org_id, reserved_by_user_id,
  status, claim_code_hash, claim_code_last4
) VALUES (
  '50000000-0000-0000-0000-000000000008',
  '60000000-0000-0000-0000-000000000007',
  '70000000-0000-0000-0000-000000000001',
  :'auth_org_admin_1'::uuid,
  'RESERVED',
  crypt('BYTE-TINY-1111', gen_salt('bf')),
  '1111'
)
ON CONFLICT (reservation_id) DO NOTHING;

-- Second reservation should FAIL (sold out)
DO $$
BEGIN
  INSERT INTO reservation (
    reservation_id, posting_id, org_id, reserved_by_user_id,
    status, claim_code_hash, claim_code_last4
  ) VALUES (
    '50000000-0000-0000-0000-00000000BAD7',
    '60000000-0000-0000-0000-000000000007',
    '70000000-0000-0000-0000-000000000002',
    :'auth_consumer_1'::uuid,
    'RESERVED',
    crypt('BYTE-TINY-2222', gen_salt('bf')),
    '2222'
  );
  RAISE NOTICE '[BAD seed] oversell unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] oversell rejected: %', SQLERRM;
END $$;


-- 6A) Forecasting history: demand_observation (GOOD, bigger + varied)

-- Seed 12 weeks for multiple buckets (seller/category/window/discount/weather)
-- Keep it deterministic: explicit rows and predictable trends.

-- Seller 1: Bakery, 17–18, discount 40
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

-- Seller 2: Hot meals, 18–19:30, discount 30
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


-- 6B) Forecasting history (BAD seeds, should FAIL)

-- BAD: day_of_week out of range (violates CHECK 1..7)
DO $$
BEGIN
  INSERT INTO demand_observation (
    obs_id, seller_id, category_id, window_id,
    date, day_of_week, discount_pct, weather_flag,
    observed_reservations, observed_no_show_rate
  ) VALUES (
    'd0000000-0000-0000-0000-00000000BAD8',
    '80000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    current_date - 3,
    9,
    40,
    false,
    10,
    0.12
  );
  RAISE NOTICE '[BAD seed] demand_observation bad day_of_week unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] demand_observation bad day_of_week rejected: %', SQLERRM;
END $$;


-- 7A) Forecast runs + outputs (GOOD)

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

-- A few forecast outputs for the ACTIVE postings
INSERT INTO forecast_output (
  output_id, run_id, posting_id,
  predicted_reservations, predicted_no_show_prob, confidence, rationale_text
) VALUES
  ('fo000000-0000-0000-0000-000000000001','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001',
   12.3, 0.14, 0.74,
   'Uses seller+window+day-of-week history (12 weeks). Tuesday 17:00–18:00 is trending up. Weather=false + 40% discount boosts demand. Recommend post ~12 (not 18) to avoid leftovers; confidence moderate (limited history).'),

  ('fo000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002',
   20.2, 0.21, 0.70,
   'Hot meals show higher no-show rates in 18:00–19:30. With 30% discount and Weather=false demand is strong but no-shows ~0.2. Recommend post 20–21 (not 25) unless reminders/shorter window; confidence moderate.'),

  ('fo000000-0000-0000-0000-000000000003','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000003',
   7.4, 0.10, 0.62,
   'Produce at lunchtime sells steadily. Low no-show historically. Recommend post 7–8 bundles; confidence ok.'),

  ('fo000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000004',
   6.1, 0.08, 0.58,
   'Early dairy pickups have lower demand. Recommend smaller quantity or higher discount; confidence medium-low.')
ON CONFLICT (output_id) DO NOTHING;

-- Baseline outputs for one posting (useful for report screenshots)
INSERT INTO forecast_output (
  output_id, run_id, posting_id,
  predicted_reservations, predicted_no_show_prob, confidence, rationale_text
) VALUES
  ('fo000000-0000-0000-0000-000000000101','f0000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',
   11.5, 0.15, 0.55,'Moving average (4w) on same seller/category/window. No-show prob = recent mean.'),

  ('fo000000-0000-0000-0000-000000000102','f0000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001',
   14.0, 0.12, 0.52,'Seasonal naive: last value for same ISO day-of-week bucket. No-show prob = last observed.')
ON CONFLICT (output_id) DO NOTHING;


-- 7B) Forecast outputs (BAD seeds, should FAIL)

-- BAD: forecast_output pointing at missing posting_id (FK)
DO $$
BEGIN
  INSERT INTO forecast_output (
    output_id, run_id, posting_id,
    predicted_reservations, predicted_no_show_prob, confidence, rationale_text
  ) VALUES (
    'fo000000-0000-0000-0000-00000000BAD9',
    'f0000000-0000-0000-0000-000000000003',
    '66666666-6666-6666-6666-666666666666',
    10.0, 0.1, 0.5, 'Should fail FK.'
  );
  RAISE NOTICE '[BAD seed] forecast_output FK unexpectedly inserted (should not happen).';
EXCEPTION WHEN others THEN
  RAISE NOTICE '[BAD seed expected] forecast_output FK rejected: %', SQLERRM;
END $$;


-- 8) Seller weekly metrics (GOOD)

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
