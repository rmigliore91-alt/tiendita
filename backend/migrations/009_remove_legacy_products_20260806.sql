-- ============================================================
-- 009_remove_legacy_products_20260806.sql
-- Eliminación de productos legacy – 06/08/2026
-- ============================================================
-- Elimina los 44 productos de muestra/legacy sin movimientos
-- que no forman parte del inventario real de La Tiendita.
-- El único producto legacy con movimientos (ALOEVERA1L) se
-- desactiva en lugar de eliminarse para preservar el historial.
-- ============================================================

-- -------------------------------------------------------
-- STEP 1 – Desactivar el producto legacy con movimientos
-- (No se puede eliminar por integridad referencial)
-- -------------------------------------------------------
UPDATE products SET active = FALSE WHERE sku = 'ALOEVERA1L';

-- -------------------------------------------------------
-- STEP 2 – Eliminar los 44 productos legacy sin movimientos
-- -------------------------------------------------------
DELETE FROM products
WHERE sku IN (
  '74312042904', '74312075803', '74312077609', '74312133299',
  '74312134371', '74312154171', '74312157455', '74312171390',
  '74312528026', '74312594083', '74312764868',
  'ACO', 'ALOEPROP113', 'AT', 'BARRAINO', 'COLAN3',
  'COLLAG12U', 'COLLAG30U', 'COLLAG6U', 'COLTERBEI',
  'fy6700', 'FY810',
  'GIM-001', 'GIM-002',
  'HIG-001', 'HIG-002', 'HIG-003',
  'IMUNDRNK12', 'LK40183', 'MESASOBRE',
  'MOV-001', 'MOV-002', 'MOV-003', 'MOV-004', 'MOV-005',
  'PAN-003', 'PAN-005',
  'SAL-001', 'SAL-002', 'SAL-003', 'SAL-004',
  'SNE-001', 'SNE-002', 'SNE-003'
);
