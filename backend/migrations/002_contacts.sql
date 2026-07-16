-- ============================================================
-- 002_contacts.sql  –  Contacts + Budgets
-- ============================================================

-- -------------------------
-- Contacts
-- -------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  ruc        VARCHAR(50),
  email      VARCHAR(150),
  phone1     VARCHAR(50),
  phone2     VARCHAR(50),
  address    TEXT,
  notes      TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_name   ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_ruc    ON contacts(ruc);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(active);

-- -------------------------
-- Budgets (presupuestos guardados)
-- -------------------------
CREATE TABLE IF NOT EXISTS budgets (
  id           SERIAL PRIMARY KEY,
  contact_id   INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  subtotal     BIGINT NOT NULL DEFAULT 0,
  delivery_cost BIGINT NOT NULL DEFAULT 0,
  total        BIGINT NOT NULL DEFAULT 0,
  with_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  distance_km  NUMERIC(6,2),
  client_name  VARCHAR(200),   -- snapshot del nombre al momento de emitir
  client_phone VARCHAR(50),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budgets_contact   ON budgets(contact_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user      ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_created   ON budgets(created_at DESC);

-- -------------------------
-- Budget Items
-- -------------------------
CREATE TABLE IF NOT EXISTS budget_items (
  id          SERIAL PRIMARY KEY,
  budget_id   INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,  -- snapshot
  sku         VARCHAR(80),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  BIGINT NOT NULL DEFAULT 0,
  subtotal    BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
