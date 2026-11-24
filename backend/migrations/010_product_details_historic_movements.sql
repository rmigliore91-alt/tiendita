-- ============================================================
-- 010_product_details_historic_movements.sql
-- · products.description : descripción libre del producto (opcional)
-- · products.details     : características específicas como lista
--                          [{ "label": "Talle", "value": "M" }, …]
-- · movements.affects_stock : FALSE para movimientos antiguos que se
--                          cargan solo como historial (ya reflejados
--                          en un conteo de inventario).
-- El número de factura ya era nullable (006); pasa a ser opcional.
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE movements
  ADD COLUMN IF NOT EXISTS affects_stock BOOLEAN NOT NULL DEFAULT TRUE;
