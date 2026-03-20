-- Forecast actions: sellers record what they did based on forecast recommendations

CREATE TABLE IF NOT EXISTS forecast_action (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES seller(seller_id) ON DELETE CASCADE,
  posting_id UUID REFERENCES bundle_posting(posting_id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecast_action_seller
  ON forecast_action (seller_id, created_at DESC);
