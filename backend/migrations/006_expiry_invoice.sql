-- ============================================================
-- 006_expiry_invoice.sql
-- Adds expiry_date to products (optional)
-- Adds invoice_number to movements (required for new records)
-- ============================================================

-- Optional expiry date for products
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Invoice number for movements (nullable to keep existing records valid)
ALTER TABLE movements ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(80);

-- Index for fast expiry-date queries (dashboard alerts)
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date)
  WHERE expiry_date IS NOT NULL;
