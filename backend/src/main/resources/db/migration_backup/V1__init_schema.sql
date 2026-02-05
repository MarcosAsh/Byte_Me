-- Byte Me Database Schema

-- Users & Auth
CREATE TABLE user_account (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('SELLER', 'ORG_ADMIN')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sellers (restaurants, vendors)
CREATE TABLE seller (
    seller_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_account(user_id),
    name VARCHAR(255) NOT NULL,
    location_text VARCHAR(500),
    opening_hours_text VARCHAR(500),
    contact_stub VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (customers who order food for employees)
CREATE TABLE organisation (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES user_account(user_id),
    name VARCHAR(255) NOT NULL,
    location_text VARCHAR(500),
    billing_email VARCHAR(255),
    -- Gamification
    current_streak_weeks INT DEFAULT 0,
    best_streak_weeks INT DEFAULT 0,
    last_order_week_start DATE,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE category (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Bundles (food packages sellers offer)
CREATE TABLE bundle_posting (
    posting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES seller(seller_id),
    category_id UUID REFERENCES category(category_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pickup_start_at TIMESTAMPTZ NOT NULL,
    pickup_end_at TIMESTAMPTZ NOT NULL,
    quantity_total INT DEFAULT 1,
    quantity_reserved INT DEFAULT 0,
    price_cents INT NOT NULL,
    discount_pct INT DEFAULT 0,
    allergens_text VARCHAR(500),
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (org orders bundles)
CREATE TABLE org_order (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organisation(org_id),
    posting_id UUID NOT NULL REFERENCES bundle_posting(posting_id),
    quantity INT NOT NULL DEFAULT 1,
    total_price_cents INT NOT NULL,
    status VARCHAR(20) DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'COLLECTED', 'CANCELLED', 'EXPIRED')),
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    collected_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Issues
CREATE TABLE issue_report (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES org_order(order_id),
    org_id UUID REFERENCES organisation(org_id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('UNAVAILABLE', 'QUALITY', 'OTHER')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESPONDED', 'RESOLVED')),
    seller_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Badges (org-level gamification)
CREATE TABLE badge (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE organisation_badge (
    org_id UUID REFERENCES organisation(org_id),
    badge_id UUID REFERENCES badge(badge_id),
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (org_id, badge_id)
);

-- Seed Data
INSERT INTO category (name) VALUES
    ('Bakery'), ('Produce'), ('Dairy'), ('Prepared Meals'), ('Groceries'), ('Beverages'), ('Mixed');

INSERT INTO badge (code, name, description) VALUES
    ('FIRST_ORDER', 'First Order', 'Placed your first order'),
    ('STREAK_4', '4-Week Streak', 'Ordered food for 4 consecutive weeks'),
    ('STREAK_12', '12-Week Streak', 'Ordered food for 12 consecutive weeks'),
    ('ORDERS_10', '10 Orders', 'Completed 10 orders'),
    ('ORDERS_50', '50 Orders', 'Completed 50 orders'),
    ('BIG_SPENDER', 'Big Spender', 'Spent over $1000 total');
