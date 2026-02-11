/*
Byte Me — Sprint 1 schema (Postgres)

This version assumes you’re using an external auth provider (most likely Supabase Auth).
So:
- The auth system owns login + password handling + sessions/JWT.
- Your DB stores “profile” + role for each authenticated user.
- `user_id` is the auth provider UUID (e.g. Supabase `auth.users.id`).
- No `password_hash` in your tables.

Everything else (sellers, orgs, postings, reservations, forecasting, triggers) stays basically the same,
just pointing at `app_user` instead of `user_account`.

What this sets up:
- Accounts: a single login can be a seller, consumer/org admin, or maintainer.
- Sellers can post surplus bundles with a pickup window + category.
- Organisations reserve bundles. A reservation generates a claim code (stored as a hash).
- When a reservation is marked COLLECTED, you can write a rescue_event (this is the source of truth for impact + streak logic).
- Org badges are supported (badge definitions + which org has earned what).
- Minimal forecasting tables for CW1 baseline work (historical observations + forecast runs + outputs).
- A simple weekly seller metrics cache table for dashboards.

What’s intentionally not here (Sprint 2 / other DB):
- Issue reports, notifications, employee/membership tables, heavier audit logging, etc.

Notes:
- Uses pgcrypto for gen_random_uuid().
- Capacity is enforced with triggers so you can’t oversell bundles.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('SELLER', 'CONSUMER', 'ORG_ADMIN', 'MAINTAINER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE posting_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('RESERVED', 'COLLECTED', 'NO_SHOW', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- App profile table.
-- Supabase Auth owns email/password + sessions; this table stores role + any app-specific fields.
CREATE TABLE IF NOT EXISTS app_user (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller (
  seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location_text VARCHAR(500),
  opening_hours_text VARCHAR(500),
  contact_stub VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organisation (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_user(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location_text VARCHAR(500),
  billing_email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organisation_streak_cache (
  org_id UUID PRIMARY KEY REFERENCES organisation(org_id) ON DELETE CASCADE,
  current_streak_weeks INT NOT NULL DEFAULT 0,
  best_streak_weeks INT NOT NULL DEFAULT 0,
  last_rescue_week_start DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS category (
  category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS pickup_window (
  window_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(50) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

ALTER TABLE pickup_window
  DROP CONSTRAINT IF EXISTS chk_window_order;

ALTER TABLE pickup_window
  ADD CONSTRAINT chk_window_order CHECK (end_time > start_time);

CREATE TABLE IF NOT EXISTS bundle_posting (
  posting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller(seller_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category(category_id),
  window_id UUID NOT NULL REFERENCES pickup_window(window_id),

  title VARCHAR(255) NOT NULL,
  description TEXT,
  allergens_text VARCHAR(500),

  pickup_start_at TIMESTAMPTZ NOT NULL,
  pickup_end_at TIMESTAMPTZ NOT NULL,

  quantity_total INT NOT NULL DEFAULT 1,
  quantity_reserved INT NOT NULL DEFAULT 0,

  price_cents INT NOT NULL,
  discount_pct INT NOT NULL DEFAULT 0,

  estimated_weight_grams INT,

  status posting_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bundle_posting
  DROP CONSTRAINT IF EXISTS chk_pickup_order,
  DROP CONSTRAINT IF EXISTS chk_qty_nonneg,
  DROP CONSTRAINT IF EXISTS chk_qty_reserved_le_total,
  DROP CONSTRAINT IF EXISTS chk_discount_range,
  DROP CONSTRAINT IF EXISTS chk_price_nonneg,
  DROP CONSTRAINT IF EXISTS chk_weight_nonneg;

ALTER TABLE bundle_posting
  ADD CONSTRAINT chk_pickup_order CHECK (pickup_end_at > pickup_start_at),
  ADD CONSTRAINT chk_qty_nonneg CHECK (quantity_total >= 0 AND quantity_reserved >= 0),
  ADD CONSTRAINT chk_qty_reserved_le_total CHECK (quantity_reserved <= quantity_total),
  ADD CONSTRAINT chk_discount_range CHECK (discount_pct BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_price_nonneg CHECK (price_cents >= 0),
  ADD CONSTRAINT chk_weight_nonneg CHECK (estimated_weight_grams IS NULL OR estimated_weight_grams >= 0);

CREATE TABLE IF NOT EXISTS reservation (
  reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id UUID NOT NULL REFERENCES bundle_posting(posting_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  reserved_by_user_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL,

  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status reservation_status NOT NULL DEFAULT 'RESERVED',

  claim_code_hash VARCHAR(255) NOT NULL,
  claim_code_last4 VARCHAR(4),

  collected_at TIMESTAMPTZ,
  no_show_marked_at TIMESTAMPTZ,
  expired_marked_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reservation_status_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservation(reservation_id) ON DELETE CASCADE,
  changed_by_user_id UUID REFERENCES app_user(user_id) ON DELETE SET NULL,
  old_status reservation_status NOT NULL,
  new_status reservation_status NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rescue_event (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  reservation_id UUID NOT NULL UNIQUE REFERENCES reservation(reservation_id) ON DELETE CASCADE,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meals_estimate INT NOT NULL,
  co2e_estimate_grams INT NOT NULL
);

CREATE TABLE IF NOT EXISTS badge (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS organisation_badge (
  org_id UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge(badge_id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, badge_id)
);

CREATE TABLE IF NOT EXISTS demand_observation (
  obs_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller(seller_id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category(category_id),
  window_id UUID NOT NULL REFERENCES pickup_window(window_id),
  date DATE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  discount_pct INT NOT NULL,
  weather_flag BOOLEAN NOT NULL,
  observed_reservations INT NOT NULL,
  observed_no_show_rate DOUBLE PRECISION NOT NULL
);

ALTER TABLE demand_observation
  DROP CONSTRAINT IF EXISTS uq_demand_observation_bucket;

ALTER TABLE demand_observation
  ADD CONSTRAINT uq_demand_observation_bucket
  UNIQUE (seller_id, category_id, window_id, date, discount_pct, weather_flag);

CREATE TABLE IF NOT EXISTS forecast_run (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100) NOT NULL,
  params_json TEXT,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  train_start DATE,
  train_end DATE,
  eval_start DATE,
  eval_end DATE,
  metrics_json TEXT
);

CREATE TABLE IF NOT EXISTS forecast_output (
  output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES forecast_run(run_id) ON DELETE CASCADE,
  posting_id UUID NOT NULL REFERENCES bundle_posting(posting_id) ON DELETE CASCADE,
  predicted_reservations DOUBLE PRECISION NOT NULL,
  predicted_no_show_prob DOUBLE PRECISION NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  rationale_text TEXT
);

CREATE TABLE IF NOT EXISTS seller_metrics_weekly (
  seller_id UUID NOT NULL REFERENCES seller(seller_id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  posted_count INT NOT NULL,
  reserved_count INT NOT NULL,
  collected_count INT NOT NULL,
  no_show_count INT NOT NULL,
  expired_count INT NOT NULL,
  sell_through_rate DOUBLE PRECISION NOT NULL,
  waste_avoided_grams INT NOT NULL,
  PRIMARY KEY (seller_id, week_start)
);


CREATE OR REPLACE FUNCTION assert_user_role(
  p_user_id UUID,
  p_allowed_roles user_role[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM app_user
  WHERE user_id = p_user_id;

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'App user % does not exist (is the auth user linked?)', p_user_id;
  END IF;

  IF NOT (v_role = ANY (p_allowed_roles)) THEN
    RAISE EXCEPTION 'User % role % is not allowed here', p_user_id, v_role;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION trg_seller_role_check()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM assert_user_role(NEW.user_id, ARRAY['SELLER']::user_role[]);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS seller_role_check ON seller;
CREATE TRIGGER seller_role_check
BEFORE INSERT OR UPDATE OF user_id ON seller
FOR EACH ROW
EXECUTE FUNCTION trg_seller_role_check();

CREATE OR REPLACE FUNCTION trg_org_role_check()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM assert_user_role(NEW.user_id, ARRAY['CONSUMER','ORG_ADMIN']::user_role[]);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS organisation_role_check ON organisation;
CREATE TRIGGER organisation_role_check
BEFORE INSERT OR UPDATE OF user_id ON organisation
FOR EACH ROW
EXECUTE FUNCTION trg_org_role_check();

CREATE OR REPLACE FUNCTION trg_reservation_capacity_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INT;
  v_reserved INT;
  v_status posting_status;
  v_pickup_end TIMESTAMPTZ;
BEGIN
  IF NEW.status <> 'RESERVED' THEN
    RETURN NEW;
  END IF;

  SELECT quantity_total, quantity_reserved, status, pickup_end_at
    INTO v_total, v_reserved, v_status, v_pickup_end
  FROM bundle_posting
  WHERE posting_id = NEW.posting_id
  FOR UPDATE;

  IF v_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Bundle is not available for reservation';
  END IF;

  IF v_pickup_end <= NOW() THEN
    RAISE EXCEPTION 'Pickup window has already ended';
  END IF;

  IF v_reserved >= v_total THEN
    RAISE EXCEPTION 'Bundle is sold out';
  END IF;

  UPDATE bundle_posting
    SET quantity_reserved = quantity_reserved + 1
  WHERE posting_id = NEW.posting_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reservation_capacity_on_insert ON reservation;
CREATE TRIGGER reservation_capacity_on_insert
BEFORE INSERT ON reservation
FOR EACH ROW
EXECUTE FUNCTION trg_reservation_capacity_on_insert();

CREATE OR REPLACE FUNCTION trg_reservation_capacity_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'RESERVED' AND NEW.status = 'CANCELLED' THEN
    PERFORM 1 FROM bundle_posting WHERE posting_id = OLD.posting_id FOR UPDATE;

    UPDATE bundle_posting
      SET quantity_reserved = GREATEST(quantity_reserved - 1, 0)
    WHERE posting_id = OLD.posting_id;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reservation_capacity_on_update ON reservation;
CREATE TRIGGER reservation_capacity_on_update
BEFORE UPDATE OF status ON reservation
FOR EACH ROW
EXECUTE FUNCTION trg_reservation_capacity_on_update();

CREATE OR REPLACE FUNCTION trg_reservation_capacity_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'RESERVED' THEN
    PERFORM 1 FROM bundle_posting WHERE posting_id = OLD.posting_id FOR UPDATE;

    UPDATE bundle_posting
      SET quantity_reserved = GREATEST(quantity_reserved - 1, 0)
    WHERE posting_id = OLD.posting_id;
  END IF;

  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS reservation_capacity_on_delete ON reservation;
CREATE TRIGGER reservation_capacity_on_delete
BEFORE DELETE ON reservation
FOR EACH ROW
EXECUTE FUNCTION trg_reservation_capacity_on_delete();

CREATE OR REPLACE FUNCTION trg_rescue_event_requires_collected()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status reservation_status;
BEGIN
  SELECT status INTO v_status
  FROM reservation
  WHERE reservation_id = NEW.reservation_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Reservation does not exist';
  END IF;

  IF v_status <> 'COLLECTED' THEN
    RAISE EXCEPTION 'Reservation must be collected before recording rescue';
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rescue_event_requires_collected ON rescue_event;
CREATE TRIGGER rescue_event_requires_collected
BEFORE INSERT ON rescue_event
FOR EACH ROW
EXECUTE FUNCTION trg_rescue_event_requires_collected();


CREATE INDEX IF NOT EXISTS idx_bundle_posting_status_pickup
  ON bundle_posting (status, pickup_start_at);

CREATE INDEX IF NOT EXISTS idx_bundle_posting_category_window
  ON bundle_posting (category_id, window_id);

CREATE INDEX IF NOT EXISTS idx_bundle_posting_seller_created
  ON bundle_posting (seller_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reservation_posting_status
  ON reservation (posting_id, status);

CREATE INDEX IF NOT EXISTS idx_reservation_org_reserved_at
  ON reservation (org_id, reserved_at DESC);

CREATE INDEX IF NOT EXISTS idx_rescue_event_org_collected
  ON rescue_event (org_id, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_output_posting
  ON forecast_output (posting_id);

CREATE INDEX IF NOT EXISTS idx_demand_observation_seller_date
  ON demand_observation (seller_id, date);
