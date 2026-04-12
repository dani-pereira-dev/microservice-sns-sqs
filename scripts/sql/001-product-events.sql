-- Event store append-only del microservicio products (Postgres en AWS).
-- Aplicar manualmente si no usáis PRODUCTS_TYPEORM_SYNCHRONIZE=true.

CREATE TABLE IF NOT EXISTS product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_events_aggregate_version UNIQUE (aggregate_id, version)
);

CREATE INDEX IF NOT EXISTS idx_product_events_aggregate_created
  ON product_events (aggregate_id, created_at);
