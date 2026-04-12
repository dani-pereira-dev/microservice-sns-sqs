-- Outbox: marca publicación en SNS. Aplicar en DBs ya creadas con 001-product-events.sql.

ALTER TABLE product_events
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_product_events_outbox_pending
  ON product_events (created_at)
  WHERE published_at IS NULL;
