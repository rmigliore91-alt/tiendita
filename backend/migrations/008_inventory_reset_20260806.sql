-- ============================================================
-- 008_inventory_reset_20260806.sql
-- Reseteo total de inventario – Conteo físico 03/08/2026
-- Aplicado: 06/08/2026
-- Moneda: Guaraníes (Moneda Local)
-- Familia: Tiendita
-- ============================================================
-- Estrategia:
--   STEP 1 – Poner en 0 el stock de TODOS los productos activos
--            (reseteo completo según los datos del conteo físico).
--   STEP 2 – Actualizar stock de los productos que tienen stock > 0,
--            identificados por SKU.
--   STEP 3 – Upsert de los 4 productos sin código asignado:
--            · Si ya existen (por SKU generado SIN-*), actualizar stock.
--            · Si no existen, insertarlos.
-- ============================================================

-- -------------------------------------------------------
-- STEP 1 – Reseteo global: stock_current = 0 en todos los productos
-- -------------------------------------------------------
UPDATE products SET stock_current = 0, active = TRUE;

-- -------------------------------------------------------
-- STEP 2 – Actualizar stock de productos con stock > 0 (por SKU)
-- -------------------------------------------------------

-- Trigenesis
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '04VIEPDV4000227';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '04VIEPPP4201126';
UPDATE products SET stock_current = 43, active = TRUE WHERE sku = '04VIETEP2250226';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '04VIMOLP275';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '04VIMOPP275';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '04VIPMTV400';

-- INDEX / Farmatitu (Abbott)
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '05ABPMAV850';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '05ABPMEC400';
UPDATE products SET stock_current = 8,  active = TRUE WHERE sku = '05ABPMPV220';

-- Punto Farma / Pronto Farma (Plenitud)
UPDATE products SET stock_current = 9,  active = TRUE WHERE sku = '06PLPAPTG160325';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLPAPTM16';
UPDATE products SET stock_current = 9,  active = TRUE WHERE sku = '06PLPAPXG160325';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRIFGXG80000';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '06PLRIFTPM8';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRISPM16';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRISXG160000';

-- Austen / Fortis (Higifral)
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '08HICCDTM5U0000';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '08HIPACTG200000';
UPDATE products SET stock_current = 30, active = TRUE WHERE sku = '08HIPACTM240000';
UPDATE products SET stock_current = 6,  active = TRUE WHERE sku = '08HIPACTP300000';
UPDATE products SET stock_current = 10, active = TRUE WHERE sku = '08HIPAMTM180000';
UPDATE products SET stock_current = 11, active = TRUE WHERE sku = '08HIRIPPM140000';
UPDATE products SET stock_current = 11, active = TRUE WHERE sku = '08HIRIPXG140000';

-- Aries
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '0900PEPPLEG0000';

-- -------------------------------------------------------
-- STEP 3 – Upsert de los 4 productos sin código de sistema
-- -------------------------------------------------------
INSERT INTO products (category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price, active)
VALUES
  (5, 'COJÍN CON FUNDA NEGRA',    'SIN-COJFUNDA001',  'unidad', 1, 1, 0, 0, TRUE),
  (5, 'ALMOHADÓN DE VELLÓN',      'SIN-ALMVELLON001', 'unidad', 1, 1, 0, 0, TRUE),
  (5, 'SOPORTE SACRO LUMBAR',     'SIN-SOPTSACRO001', 'unidad', 1, 1, 0, 0, TRUE),
  (5, 'INMOVILIZADOR',            'SIN-INMOVIL001',   'unidad', 1, 1, 0, 0, TRUE)
ON CONFLICT (sku) DO UPDATE
  SET stock_current = EXCLUDED.stock_current,
      name          = EXCLUDED.name,
      active        = TRUE;

-- -------------------------------------------------------
-- STEP 4 – Verificación (ejecutar manualmente para confirmar)
-- -------------------------------------------------------
-- SELECT p.sku, p.name, p.stock_current, c.name AS categoria
-- FROM products p
-- JOIN categories c ON c.id = p.category_id
-- WHERE p.stock_current > 0
-- ORDER BY c.name, p.name;
