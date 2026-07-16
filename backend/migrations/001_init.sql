-- ============================================================
-- 001_init.sql  –  Tiendita Stock Management Schema + Seed
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------
-- Users
-- -------------------------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin','operator')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- Categories
-- -------------------------
CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL
);

-- -------------------------
-- Products
-- -------------------------
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  category_id    INTEGER NOT NULL REFERENCES categories(id),
  name           VARCHAR(200) NOT NULL,
  sku            VARCHAR(80) UNIQUE NOT NULL,
  unit           VARCHAR(40) NOT NULL DEFAULT 'unidad',
  stock_current  INTEGER NOT NULL DEFAULT 0 CHECK (stock_current >= 0),
  stock_minimum  INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimum >= 0),
  cost_price     BIGINT NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price     BIGINT NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- Movements
-- -------------------------
CREATE TABLE IF NOT EXISTS movements (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  user_id     INTEGER NOT NULL REFERENCES users(id),
  type        VARCHAR(10) NOT NULL CHECK (type IN ('ENTRADA','SALIDA')),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_price  BIGINT NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price BIGINT NOT NULL DEFAULT 0,
  sale_type   VARCHAR(10) CHECK (sale_type IN ('interna', 'externa')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------
-- Indexes
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active     ON products(active);
CREATE INDEX IF NOT EXISTS idx_movements_product   ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_user      ON movements(user_id);
CREATE INDEX IF NOT EXISTS idx_movements_created   ON movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_type      ON movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_sale_type ON movements(sale_type);

-- -------------------------
-- Seed: Categories
-- -------------------------
INSERT INTO categories (name) VALUES
  ('Suplementos Nutricionales'),
  ('Suplementos Alimenticios'),
  ('Equipos de Gimnasia'),
  ('Cuidado e Higiene Personal'),
  ('Movilidad y Seguridad')
ON CONFLICT DO NOTHING;

-- -------------------------
-- Seed: Default Admin User
-- password: Admin1234
-- hash generated with bcrypt rounds=10
-- -------------------------
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@taita.com.py',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- -------------------------
-- Seed: Sample Products
-- -------------------------
INSERT INTO products (category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price)
VALUES
  (1, 'Espesante Resource ThickenUp', 'SNE-001', 'lata', 25, 10, 85000, 110000),
  (1, 'Suplemento Polimérico Ensure', 'SNE-002', 'caja', 40, 15, 120000, 155000),
  (1, 'Modulen IBD (específico)', 'SNE-003', 'lata', 8, 10, 210000, 265000),
  (2, 'Ácidos Grasos Omega-3', 'SAL-001', 'frasco', 30, 12, 65000, 85000),
  (2, 'Colágeno Hidrolizado', 'SAL-002', 'bolsa', 20, 8, 75000, 98000),
  (2, 'Vitamina D3 + K2', 'SAL-003', 'frasco', 45, 15, 42000, 58000),
  (2, 'Fibra Prebiótica', 'SAL-004', 'lata', 18, 10, 55000, 72000),
  (3, 'Bicicleta Estática Sunny', 'GIM-001', 'unidad', 4, 2, 850000, 1100000),
  (3, 'Caminadora Plegable', 'GIM-002', 'unidad', 3, 2, 1500000, 1950000),
  (4, 'Pañal Adulto Tena M', 'HIG-001', 'paquete', 60, 20, 48000, 62000),
  (4, 'Crema Hidratante Geriatric', 'HIG-002', 'tubo', 35, 15, 28000, 38000),
  (4, 'Toallitas Húmedas Adulto', 'HIG-003', 'paquete', 80, 30, 18000, 25000),
  (5, 'Andador Aluminio con Ruedas', 'MOV-001', 'unidad', 12, 5, 320000, 420000),
  (5, 'Bastón Cuadripodal', 'MOV-002', 'unidad', 20, 8, 95000, 128000),
  (5, 'Silla de Ruedas Estándar', 'MOV-003', 'unidad', 6, 3, 680000, 890000),
  (5, 'Colchón Antiescaras', 'MOV-004', 'unidad', 5, 3, 420000, 560000),
  (5, 'Elevador Sanitario', 'MOV-005', 'unidad', 9, 4, 185000, 245000)
ON CONFLICT (sku) DO NOTHING;
