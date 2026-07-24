-- ============================================================
-- 004_budgets_status.sql
-- Adds status column to budgets for sale confirmation tracking.
-- Adds optional budget_id FK to movements so confirmed-sale
-- movements can be traced back to the originating budget.
-- ============================================================

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed'));

-- Optional: track which budget originated a movement
ALTER TABLE movements
  ADD COLUMN IF NOT EXISTS budget_id INTEGER REFERENCES budgets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_movements_budget ON movements(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status   ON budgets(status);
