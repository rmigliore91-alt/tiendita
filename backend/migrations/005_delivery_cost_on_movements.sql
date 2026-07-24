-- ============================================================
-- 005_delivery_cost_on_movements.sql
-- Tracks supplier delivery cost per stock entry movement.
-- supplier_delivery_cost : total freight cost paid to supplier (on the whole purchase)
-- delivery_cost_share    : proportional freight assigned to this specific movement item
-- cost_price_at_entry    : effective cost per unit at time of entry (unit_price + delivery_share/qty)
-- ============================================================

ALTER TABLE movements
  ADD COLUMN IF NOT EXISTS supplier_delivery_cost BIGINT NOT NULL DEFAULT 0 CHECK (supplier_delivery_cost >= 0),
  ADD COLUMN IF NOT EXISTS delivery_cost_share    BIGINT NOT NULL DEFAULT 0 CHECK (delivery_cost_share >= 0),
  ADD COLUMN IF NOT EXISTS cost_price_at_entry    BIGINT NOT NULL DEFAULT 0 CHECK (cost_price_at_entry >= 0);

CREATE INDEX IF NOT EXISTS idx_movements_cost_entry ON movements(cost_price_at_entry) WHERE cost_price_at_entry > 0;
