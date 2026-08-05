-- ============================================================
-- 007_inventory_update_20260803.sql
-- Actualización de inventario físico – 03/08/2026
-- ============================================================
-- Estrategia:
--   1. Para productos existentes: actualiza stock_current al valor real contado.
--   2. Para productos nuevos (no existentes en BD): inserta con los datos del conteo.
--   3. Los 4 productos sin ID de sistema reciben un SKU generado (SIN-XXX).
-- ============================================================

-- -------------------------------------------------------
-- STEP 1 – Actualizar stock de productos EXISTENTES por SKU
-- -------------------------------------------------------
-- Si el SKU ya existe en la tabla products, actualizamos stock_current
-- y nos aseguramos de que esté activo.

UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '04VIEPDV4000227';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '04VIEPPP4201126';
UPDATE products SET stock_current = 43, active = TRUE WHERE sku = '04VIETEP2250226';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '04VIMOLP275';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '04VIMOPP275';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '04VIPMTV400';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '05ABPMAV850';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '05ABPMEC400';
UPDATE products SET stock_current = 8,  active = TRUE WHERE sku = '05ABPMPV220';
UPDATE products SET stock_current = 9,  active = TRUE WHERE sku = '06PLPAPTG160325';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLPAPTM16';
UPDATE products SET stock_current = 9,  active = TRUE WHERE sku = '06PLPAPXG160325';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRIFGXG80000';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '06PLRIFTPM8';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRISPM16';
UPDATE products SET stock_current = 4,  active = TRUE WHERE sku = '06PLRISXG160000';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '08HICCDTM5U0000';
UPDATE products SET stock_current = 2,  active = TRUE WHERE sku = '08HIPACTG200000';
UPDATE products SET stock_current = 30, active = TRUE WHERE sku = '08HIPACTM240000';
UPDATE products SET stock_current = 6,  active = TRUE WHERE sku = '08HIPACTP300000';
UPDATE products SET stock_current = 10, active = TRUE WHERE sku = '08HIPAMTM180000';
UPDATE products SET stock_current = 11, active = TRUE WHERE sku = '08HIRIPPM140000';
UPDATE products SET stock_current = 11, active = TRUE WHERE sku = '08HIRIPXG140000';
UPDATE products SET stock_current = 1,  active = TRUE WHERE sku = '0900PEPPLEG0000';

-- -------------------------------------------------------
-- STEP 2 – Insertar productos NUEVOS (si no existen)
-- -------------------------------------------------------
-- Categorías de referencia (según 001_init.sql):
--   1 = Suplementos Nutricionales
--   2 = Suplementos Alimenticios
--   3 = Equipos de Gimnasia
--   4 = Cuidado e Higiene Personal
--   5 = Movilidad y Seguridad

INSERT INTO products (category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price)
VALUES
  -- Enterex / Suplementos Nutricionales
  (1, 'ENTEREX DIABETIC VAINILLA POLVO 400G',              '04VIEPDV4000227',  'unidad', 1,  3, 0, 0),
  (1, 'ENTEREX PROTICAL VAINILLA POLVO 420G',              '04VIEPPP4201126',  'unidad', 2,  3, 0, 0),
  (1, 'ENTEREX ESPESANTE FOOD THICKENER POLVO 227G',       '04VIETEP2250226',  'unidad', 43, 5, 0, 0),
  (1, 'ENTEREX LEUSYN PRO POLVO 275G',                     '04VIMOLP275',      'unidad', 2,  3, 0, 0),
  (1, 'ENTEREX PROTEINEX POLVO 275G',                      '04VIMOPP275',      'unidad', 1,  3, 0, 0),
  (1, 'ENTEREX TOTAL VAINILLA POLVO 400G',                 '04VIPMTV400',      'unidad', 4,  3, 0, 0),

  -- Ensure / Suplementos Nutricionales
  (1, 'ENSURE ADVANCE VAINILLA X 850G',                    '05ABPMAV850',      'unidad', 1,  2, 0, 0),
  (1, 'ENSURE VAINILLA POLVO X 400G CAJA',                 '05ABPMEC400',      'unidad', 1,  2, 0, 0),
  (1, 'ENSURE PLUS VAINILLA 220ML',                        '05ABPMPV220',      'unidad', 8,  5, 0, 0),

  -- Plenitud / Cuidado e Higiene Personal
  (4, 'PAÑAL PLENITUD PROTECT G X16UNID',                  '06PLPAPTG160325',  'paquete', 9, 3, 0, 0),
  (4, 'PAÑAL PLENITUD PROTECT M X16UNID',                  '06PLPAPTM16',      'paquete', 4, 3, 0, 0),
  (4, 'PAÑAL PLENITUD PROTECT XG X16UNID',                 '06PLPAPXG160325',  'paquete', 9, 3, 0, 0),
  (4, 'PLENITUD FEMME ROPA INTERIOR G/XG 8UNID',           '06PLRIFGXG80000',  'paquete', 4, 2, 0, 0),
  (4, 'PLENITUD FEMME ROPA INTERIOR P/M 8UNID',            '06PLRIFTPM8',      'paquete', 2, 2, 0, 0),
  (4, 'ROPA INTERIOR PLENITUD PROTECT PLUS P/M X16UNID',   '06PLRISPM16',      'paquete', 4, 2, 0, 0),
  (4, 'ROPA INTERIOR PLENITUD PROTECT PLUS G/XG X16UNID',  '06PLRISXG160000',  'paquete', 4, 2, 0, 0),

  -- Higifral / Cuidado e Higiene Personal
  (4, 'PROTECTOR DE COLCHON HIGIFRAL M X6UNID',            '08HICCDTM5U0000',  'paquete', 2,  2, 0, 0),
  (4, 'PAÑAL HIGIFRAL COMFORT MEGA AD. G X20UNID',         '08HIPACTG200000',  'paquete', 2,  2, 0, 0),
  (4, 'PAÑAL HIGIFRAL COMFORT MEGA AD. M X24UNID',         '08HIPACTM240000',  'paquete', 30, 5, 0, 0),
  (4, 'PAÑAL HIGIFRAL COMFORT MEGA AD. P X30UNID',         '08HIPACTP300000',  'paquete', 6,  2, 0, 0),
  (4, 'PAÑAL HIGIFRAL PREMIUM MEGA AD. M X18UNID',         '08HIPAMTM180000',  'paquete', 10, 3, 0, 0),
  (4, 'ROPA INTERIOR HIGIFRAL PANTS P/M X16 UNID',         '08HIRIPPM140000',  'paquete', 11, 3, 0, 0),
  (4, 'ROPA INTERIOR HIGIFRAL PANTS G/EXG X16 UNID',       '08HIRIPXG140000',  'paquete', 11, 3, 0, 0),

  -- Equipos de Gimnasia
  (3, 'PEDAL PARA FISIOTERAPIA PLEGABLE',                   '0900PEPPLEG0000',  'unidad', 1, 1, 0, 0),

  -- Movilidad y Seguridad (sin ID de sistema → SKU generado)
  (5, 'COJÍN CON FUNDA NEGRA',                              'SIN-COJFUNDA001',  'unidad', 1, 1, 0, 0),
  (5, 'ALMOHADÓN DE VELLÓN',                                'SIN-ALMVELLON001', 'unidad', 1, 1, 0, 0),
  (5, 'SOPORTE SACRO LUMBAR',                               'SIN-SOPTSACRO001', 'unidad', 1, 1, 0, 0),
  (5, 'INMOVILIZADOR',                                      'SIN-INMOVIL001',   'unidad', 1, 1, 0, 0)
ON CONFLICT (sku) DO NOTHING;

-- -------------------------------------------------------
-- STEP 3 – Verificación de resultados (informativo)
-- -------------------------------------------------------
-- Ejecutar este SELECT para confirmar los stocks actualizados:
--
-- SELECT p.sku, p.name, p.stock_current, c.name AS categoria
-- FROM products p
-- JOIN categories c ON c.id = p.category_id
-- WHERE p.sku IN (
--   '04VIEPDV4000227','04VIEPPP4201126','04VIETEP2250226','04VIMOLP275',
--   '04VIMOPP275','04VIPMTV400','05ABPMAV850','05ABPMEC400','05ABPMPV220',
--   '06PLPAPTG160325','06PLPAPTM16','06PLPAPXG160325','06PLRIFGXG80000',
--   '06PLRIFTPM8','06PLRISPM16','06PLRISXG160000','08HICCDTM5U0000',
--   '08HIPACTG200000','08HIPACTM240000','08HIPACTP300000','08HIPAMTM180000',
--   '08HIRIPPM140000','08HIRIPXG140000','0900PEPPLEG0000',
--   'SIN-COJFUNDA001','SIN-ALMVELLON001','SIN-SOPTSACRO001','SIN-INMOVIL001'
-- )
-- ORDER BY c.name, p.name;
