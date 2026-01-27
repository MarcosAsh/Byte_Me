-- Enum types
CREATE TYPE user_role AS ENUM ('SELLER', 'ORG_ADMIN', 'EMPLOYEE', 'MAINTAINER');
CREATE TYPE bundle_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE reservation_status AS ENUM ('RESERVED', 'COLLECTED', 'NO_SHOW', 'EXPIRED', 'CANCELLED');
CREATE TYPE issue_type AS ENUM ('UNAVAILABLE', 'QUALITY', 'OTHER');
CREATE TYPE issue_status AS ENUM ('OPEN', 'RESPONDED', 'RESOLVED');

-- user_account
CREATE TABLE user_account (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role    NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- organisation
CREATE TABLE organisation (
    org_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    location_text   VARCHAR(255),
    billing_stub    VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- category
CREATE TABLE category (
    category_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL UNIQUE
);

-- seller
CREATE TABLE seller (
    seller_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID         NOT NULL REFERENCES user_account(user_id),
    name                VARCHAR(255) NOT NULL,
    location_text       VARCHAR(255),
    opening_hours_text  VARCHAR(255),
    contact_stub        VARCHAR(255),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- employee
CREATE TABLE employee (
    employee_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id                UUID         NOT NULL REFERENCES organisation(org_id),
    user_id               UUID         REFERENCES user_account(user_id),
    display_name          VARCHAR(255) NOT NULL,
    current_streak_weeks  INTEGER      NOT NULL DEFAULT 0,
    best_streak_weeks     INTEGER      NOT NULL DEFAULT 0,
    last_rescue_week_start DATE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- badge
CREATE TABLE badge (
    badge_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(255) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT
);

-- bundle_posting
CREATE TABLE bundle_posting (
    posting_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id             UUID            NOT NULL REFERENCES seller(seller_id),
    category_id           UUID            REFERENCES category(category_id),
    pickup_start_at       TIMESTAMPTZ     NOT NULL,
    pickup_end_at         TIMESTAMPTZ     NOT NULL,
    quantity_total        INTEGER         NOT NULL,
    quantity_reserved     INTEGER         NOT NULL DEFAULT 0,
    price_cents           INTEGER         NOT NULL,
    discount_pct          INTEGER         NOT NULL,
    contents_text         TEXT,
    allergens_text        VARCHAR(255),
    status                bundle_status   NOT NULL DEFAULT 'DRAFT',
    estimated_weight_grams INTEGER,
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- reservation
CREATE TABLE reservation (
    reservation_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_id        UUID               NOT NULL REFERENCES bundle_posting(posting_id),
    org_id            UUID               REFERENCES organisation(org_id),
    employee_id       UUID               REFERENCES employee(employee_id),
    reserved_at       TIMESTAMPTZ        NOT NULL DEFAULT now(),
    status            reservation_status NOT NULL DEFAULT 'RESERVED',
    claim_code_hash   VARCHAR(255),
    claim_code_last4  VARCHAR(255),
    collected_at      TIMESTAMPTZ,
    no_show_marked_at TIMESTAMPTZ,
    expired_marked_at TIMESTAMPTZ
);

-- rescue_event
CREATE TABLE rescue_event (
    event_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id          UUID        NOT NULL REFERENCES employee(employee_id),
    reservation_id       UUID        NOT NULL REFERENCES reservation(reservation_id),
    collected_at         TIMESTAMPTZ NOT NULL,
    meals_estimate       INTEGER,
    co2e_estimate_grams  INTEGER
);

-- issue_report
CREATE TABLE issue_report (
    issue_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posting_id      UUID         REFERENCES bundle_posting(posting_id),
    reservation_id  UUID         REFERENCES reservation(reservation_id),
    employee_id     UUID         REFERENCES employee(employee_id),
    type            issue_type   NOT NULL,
    description     TEXT         NOT NULL,
    status          issue_status NOT NULL DEFAULT 'OPEN',
    seller_response TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ
);

-- employee_badge (composite PK)
CREATE TABLE employee_badge (
    employee_id UUID        NOT NULL REFERENCES employee(employee_id),
    badge_id    UUID        NOT NULL REFERENCES badge(badge_id),
    awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (employee_id, badge_id)
);
