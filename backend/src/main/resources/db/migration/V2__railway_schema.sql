/*
Byte Me — Railway-compatible schema
Matches JPA entities. Uses plain PostgreSQL (no Supabase auth dependency).
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_account (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller (
  seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location_text VARCHAR(500),
  opening_hours_text VARCHAR(500),
  contact_stub VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organisation (
  org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_account(user_id) ON DELETE CASCADE,
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
  end_time TIME NOT NULL,
  CONSTRAINT chk_window_order CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS bundle_posting (
  posting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller(seller_id) ON DELETE CASCADE,
  category_id UUID REFERENCES category(category_id),
  window_id UUID REFERENCES pickup_window(window_id),
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
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pickup_order CHECK (pickup_end_at > pickup_start_at),
  CONSTRAINT chk_qty_nonneg CHECK (quantity_total >= 0 AND quantity_reserved >= 0),
  CONSTRAINT chk_qty_reserved_le_total CHECK (quantity_reserved <= quantity_total),
  CONSTRAINT chk_discount_range CHECK (discount_pct BETWEEN 0 AND 100),
  CONSTRAINT chk_price_nonneg CHECK (price_cents >= 0),
  CONSTRAINT chk_weight_nonneg CHECK (estimated_weight_grams IS NULL OR estimated_weight_grams >= 0)
);

CREATE TABLE IF NOT EXISTS reservation (
  reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id UUID NOT NULL REFERENCES bundle_posting(posting_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisation(org_id) ON DELETE CASCADE,
  reserved_by_user_id UUID REFERENCES user_account(user_id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
  claim_code_hash VARCHAR(255) NOT NULL,
  claim_code_last4 VARCHAR(4),
  collected_at TIMESTAMPTZ,
  no_show_marked_at TIMESTAMPTZ,
  expired_marked_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
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

CREATE TABLE IF NOT EXISTS issue_report (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES reservation(reservation_id) ON DELETE SET NULL,
  org_id UUID REFERENCES organisation(org_id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  seller_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bundle_posting_status_pickup ON bundle_posting (status, pickup_start_at);
CREATE INDEX IF NOT EXISTS idx_bundle_posting_seller_created ON bundle_posting (seller_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reservation_posting_status ON reservation (posting_id, status);
CREATE INDEX IF NOT EXISTS idx_reservation_org_reserved_at ON reservation (org_id, reserved_at DESC);
