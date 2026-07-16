-- ============================================================
-- products.sql  –  Seed de 130 productos reales de Taita
-- ============================================================

-- Categorías (upsert seguro)
INSERT INTO categories (id, name) VALUES
  (1, 'Suplementos Nutricionales'),
  (2, 'Suplementos Alimenticios'),
  (3, 'Equipos de Gimnasia'),
  (4, 'Cuidado e Higiene Personal'),
  (5, 'Movilidad y Seguridad'),
  (6, 'Sillón')
ON CONFLICT (id) DO NOTHING;

-- Resetear la secuencia para que no haya conflicto con los IDs
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));

-- ---------------------------------------------------------------
-- Productos
-- stock_current = 0, stock_minimum = 5/1/10, cost_price = 0
-- sale_price en PYG
-- ---------------------------------------------------------------
INSERT INTO products (category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price, active) VALUES

-- ─────────────────────────────────────────────
-- SUPLEMENTOS NUTRICIONALES (category_id = 1)
-- ─────────────────────────────────────────────
(1, 'ABINTRA, Sabor Naranja, polvo, 27 g', '04VIIMAPN27', 'sobre 27g', 0, 5, 0, 134500, true),
(1, 'Enterex ESPESANTE FOOD THICKENER, polvo, 227 g', '04VIETEP225', 'frasco 227g', 0, 5, 0, 100500, true),
(1, 'GLUTAPAK®, polvo, 15 g', '04VIIMGRP15', 'sobre 15g', 0, 5, 0, 53000, true),
(1, 'Enterex GLUTAPAK-10, polvo, 15 g', '04VIIMG1015', 'sobre 15g', 0, 5, 0, 40000, true),
(1, 'INMUNEX PLUS, Vainilla lata, polvo, 131 g', '04VIIMIP131', 'lata 131g', 0, 5, 0, 217000, true),
(1, 'Enterex HEPATIC, polvo, 110 g', '04VIEPHP110', 'sobre 110g', 0, 5, 0, 231000, true),
(1, 'Enterex PLUS, Vainilla, Líquido, 237 ml', '04VIMOPV237', 'unidad 237ml', 0, 10, 0, 37000, true),
(1, 'Enterex PROTEINEX, polvo, 275 g', '04VIMOPP275', 'sobre 275g', 0, 5, 0, 182500, true),
(1, 'Enterex ProtiCal, Vainilla, polvo, 420 g', '04VIEPPP420', 'lata 420g', 0, 5, 0, 283000, true),
(1, 'Enterex TOTAL, Vainilla, polvo, 400 g', '04VIPMTV400', 'lata 400g', 0, 5, 0, 153000, true),
(1, 'LEUSYN-PRO, polvo, 275 g', '04VIMOLP275', 'sobre 275g', 0, 5, 0, 300500, true),
(1, 'Enterex KARBS, polvo, 450 g', '04VIPMKP450', 'lata 450g', 0, 5, 0, 110000, true),
(1, 'Enterex Diabetic, Vainilla, líquido, 237 ml', '04VIEPDV237', 'unidad 237ml', 0, 10, 0, 43500, true),
(1, 'Enterex Diabetic, Vainilla, polvo 400 g', '04VIEPDV400', 'lata 400g', 0, 5, 0, 149500, true),
(1, 'Ensure PLUS RECUPERACIÓN NUTRICIONAL, Vainilla, líquido, 220 ml', '05ABPMPV220', 'unidad 220ml', 0, 10, 0, 37000, true),
(1, 'Ensure PLUS RECUPERACIÓN NUTRICIONAL, Frutilla, líquido, 220 ml', '05ABPMPF220', 'unidad 220ml', 0, 10, 0, 37000, true),
(1, 'Ensure ADVANCE, Vainilla, líquido, 220 ml', '05ABPMAV220', 'unidad 220ml', 0, 10, 0, 38500, true),
(1, 'Ensure ADVANCE, Vainilla, polvo, 400 g', '05ABPMAV400', 'lata 400g', 0, 5, 0, 167000, true),
(1, 'Ensure ADVANCE, Vainilla, polvo, 850 g', '05ABPMAV850', 'lata 850g', 0, 5, 0, 326000, true),
(1, 'Ensure, Vainilla, polvo, 400 g', '05ABPMEC400', 'lata 400g', 0, 5, 0, 143000, true),
(1, 'Ensure, Vainilla, polvo, 800 g', '05ABPMEC800', 'lata 800g', 0, 5, 0, 271000, true),
(1, 'Glucerna, Vainilla, líquido, 237 ml', '05ABEPGV237', 'unidad 237ml', 0, 10, 0, 33000, true),
(1, 'Glucerna, Vainilla, polvo, 400 g', '05ABEPGV400', 'lata 400g', 0, 5, 0, 165000, true),
(1, 'Glucerna, Vainilla, polvo, 850 g', '05ABEPGV850', 'lata 850g', 0, 5, 0, 345500, true),
(1, 'Glucerna 1,0 kcal/ml, líquido, 1000 ml', '05ABEPG1000', 'botella 1000ml', 0, 5, 0, 154000, true),
(1, 'Jevity RTH 1,07 kcal/ml, líquido, 1000 ml', '05ABEPJ1000', 'botella 1000ml', 0, 5, 0, 141000, true),
(1, 'Osmolite HN, 1,06 kcal/ml, líquido 1000 ml', '05ABEPO1000', 'botella 1000ml', 0, 5, 0, 147000, true),
(1, 'Nepro AP Vainilla, 237 ml', '05ABEPNP237', 'unidad 237ml', 0, 5, 0, 54500, true),

-- ─────────────────────────────────────────────
-- SUPLEMENTOS ALIMENTICIOS (category_id = 2)
-- ─────────────────────────────────────────────
(2, 'Adult Multivitamin 75 gomitas', '01NBVIMVI75', 'frasco 75 gom.', 0, 5, 0, 124500, true),
(2, 'B-12, 500 mcg, 90 gomitas', '01NBVI12G90', 'frasco 90 gom.', 0, 5, 0, 109250, true),
(2, 'B-Complex con ácido fólico plus Vitamina C, 150 cápsulas', '01NBVIBC150', 'frasco 150 cáp.', 0, 5, 0, 142000, true),
(2, 'Biotin 10.000 mcg, 120 cápsulas blandas', '01NBVIBI120', 'frasco 120 cáp.', 0, 5, 0, 147500, true),
(2, 'C 1.000 mg, 100 cápsulas', '01NBVIC1100', 'frasco 100 cáp.', 0, 5, 0, 117000, true),
(2, 'C 1.000 mg, rose hips, 100 cápsulas', '01NBVICR100', 'frasco 100 cáp.', 0, 5, 0, 138000, true),
(2, 'C 250 mg, rose hips, 80 gomitas', '74312764868', 'frasco 80 gom.', 0, 5, 0, 128500, true),
(2, 'D3 5.000 UI, 240 cápsulas blandas', '01NBVID5240', 'frasco 240 cáp.', 0, 5, 0, 220500, true),
(2, 'E 180 mg, 120 cápsulas blandas', '01NBVI18120', 'frasco 120 cáp.', 0, 5, 0, 137000, true),
(2, 'Hair, Skin and Nails 3.000 mcg Biotin, 60 cápsulas', '74312075803', 'frasco 60 cáp.', 0, 5, 0, 106500, true),
(2, 'Melatonin 10 mg, 45 cápsulas de liberación rápida', '74312528026', 'frasco 45 cáp.', 0, 5, 0, 80000, true),
(2, 'Melatonin 5 mg, 90 cápsulas de liberación rápida', '74312157455', 'frasco 90 cáp.', 0, 5, 0, 103000, true),
(2, 'Turmeric 450 mg, 60 cápsulas', '74312154171', 'frasco 60 cáp.', 0, 5, 0, 111500, true),
(2, 'Calcium 1200 mg Plus 1000 UI Vitamin D3, 120 cápsulas', '74312134371', 'frasco 120 cáp.', 0, 5, 0, 145000, true),
(2, 'Calcium Magnesium Zinc, 100 comprimidos', '74312042904', 'frasco 100 comp.', 0, 5, 0, 89000, true),
(2, 'Magnesium 400 mg, 75 cápsulas blandas', '74312594083', 'frasco 75 cáp.', 0, 5, 0, 157000, true),
(2, 'Zinc 50 mg, 100 tabletas', '01NBMIZ5100', 'frasco 100 tab.', 0, 5, 0, 81000, true),
(2, 'L-Arginine 1.000 mg, 50 tabletas', '74312077609', 'frasco 50 tab.', 0, 5, 0, 128500, true),
(2, 'Fish Oil, 2400 mg, 1200 mg de Omega-3, 90 cápsulas', '74312133299', 'frasco 90 cáp.', 0, 5, 0, 239400, true),
(2, 'Colágeno Líquido 10 g – caja de 6 unidades', 'COLLAG6U', 'caja 6 und.', 0, 5, 0, 70000, true),
(2, 'Colágeno Líquido 10 g – caja de 12 unidades', 'COLLAG12U', 'caja 12 und.', 0, 5, 0, 126000, true),
(2, 'Colágeno Líquido 10 g – caja de 30 unidades', 'COLLAG30U', 'caja 30 und.', 0, 5, 0, 297000, true),
(2, 'Co Q-10 200 mg, 80 cápsulas blandas', '74312171390', 'frasco 80 cáp.', 0, 5, 0, 435000, true),
(2, 'Ginkgo Biloba 60 mg, 200 cápsulas', '01NBOSG6200', 'frasco 200 cáp.', 0, 5, 0, 128500, true),
(2, 'Forever Fiber, caja de 30 sticks', '02FEFDFIC30', 'caja 30 sticks', 0, 5, 0, 214000, true),
(2, 'Cúrcuma latte, 10 sachet', '24NUFDCUVAI', 'caja 10 sach.', 0, 5, 0, 49000, true),
(2, 'Hibiscus latte, 10 sachet', '24NUFDHIBJE', 'caja 10 sach.', 0, 5, 0, 53000, true),
(2, 'Fibra+6 (variantes sabor)', '24NUFD', 'unidad', 0, 5, 0, 37000, true),
(2, 'Inmunity drink, 55ml, Vit A, C, B12, zinc – caja 12 und.', 'IMUNDRNK12', 'caja 12 und.', 0, 5, 0, 130000, true),
(2, 'Bebida de Aloe Vera, 1 L', 'ALOEVERA1L', 'botella 1L', 0, 5, 0, 185000, true),
(2, 'Aloe Propolis Creme – Crema de Aloe y Propóleo, 113 g', 'ALOEPROP113', 'frasco 113g', 0, 5, 0, 146933, true),

-- ─────────────────────────────────────────────
-- EQUIPOS DE GIMNASIA (category_id = 3)
-- ─────────────────────────────────────────────
(3, 'BICICLETA ESTÁTICA ATHLETIC 290BH', '14ATBE290BH', 'unidad', 0, 1, 0, 1759000, true),
(3, 'BICICLETA ESTÁTICA ATHLETIC 290BV', '14ATBE290BV', 'unidad', 0, 1, 0, 1799000, true),
(3, 'BICICLETA ATHLETIC 1700BH', '14ATBE170BH', 'unidad', 0, 1, 0, 5167201, true),
(3, 'ELLIPTICAL ATHLETIC PROFESSIONAL 1700E', '14ATEL1700E', 'unidad', 0, 1, 0, 4415885, true),
(3, 'MULTIEJERCICIO ATHLETIC 2100M 95 KG', '14ATME2100M', 'unidad', 0, 1, 0, 5901881, true),
(3, 'MULTIEJERCICIO ATHLETIC 420M 50 KG', '14ATME420M5', 'unidad', 0, 1, 0, 2540700, true),
(3, 'REMO ATHLETIC 100RM', '14ATRE100RM', 'unidad', 0, 1, 0, 1273740, true),

-- ─────────────────────────────────────────────
-- CUIDADO E HIGIENE PERSONAL (category_id = 4)
-- ─────────────────────────────────────────────
(4, 'HIGIFRAL Premium MEGA (variantes talle)', '08HIPAM', 'paquete', 0, 5, 0, 74000, true),
(4, 'HIGIFRAL Comfort MEGA (variantes talle)', '08HIPACT', 'paquete', 0, 5, 0, 67000, true),
(4, 'HIGIFRAL Pants, Mega (variantes talle)', '08HIRIP', 'paquete 14u', 0, 5, 0, 69000, true),
(4, 'Plenitud PROTEC 16 unidades (variantes talle)', '06PLPAP', 'paquete 16u', 0, 5, 0, 107200, true),
(4, 'Plenitud Apósito, 20 unidades', '06PLAPMI30U', 'paquete 20u', 0, 5, 0, 30000, true),
(4, 'Plenitud femme, 8 unidades (variantes talle)', 'PAN-003', 'paquete 8u', 0, 5, 0, 56800, true),
(4, 'Plenitud PLUS ropa interior descartable 16 unidades', 'PAN-005', 'paquete 16u', 0, 5, 0, 116500, true),
(4, 'Cubre colchón impermeable hipoalergénico', '09CKCO18X20', 'unidad', 0, 3, 0, 160000, true),
(4, 'Cubre colchón lavable (variantes talle)', '2100CC', 'unidad', 0, 3, 0, 210000, true),
(4, 'HIGIFRAL Protector de Colchón, 5 unidades', '08HICCD', 'paquete 5u', 0, 5, 0, 27000, true),
(4, 'Toallitas húmedas hipoalergénicas Premium Doddy, 100 unidades', '07DOTHHI100', 'paquete 100u', 0, 10, 0, 12000, true),

-- ─────────────────────────────────────────────
-- MOVILIDAD Y SEGURIDAD (category_id = 5)
-- ─────────────────────────────────────────────
(5, 'ANDADOR PARA ADULTO DOBLE APOYO', '0900ANDOBGR', 'unidad', 0, 2, 0, 675000, true),
(5, 'ANDADOR REGULABLE CON RUEDAS DELANTERAS Y ASIENTO', '0900ANPC2RA', 'unidad', 0, 2, 0, 740000, true),
(5, 'ANDADOR REGULABLE CON RUEDAS DELANTERAS GRANDES', '2000ANPLC2R', 'unidad', 0, 2, 0, 390000, true),
(5, 'ANDADOR DOBLE FUNCIÓN ESTÁNDAR Y ARTICULABLE', '0900ANMARPA', 'unidad', 0, 2, 0, 390000, true),
(5, 'ANDADOR CON RUEDAS Y ASIENTO, ROLLATOR', '0900ANC4RAC', 'unidad', 0, 2, 0, 1250000, true),
(5, 'Bastón de Aluminio Regulable', '0900BABAREG', 'unidad', 0, 3, 0, 100000, true),
(5, 'BASTON CON BASE CUADRUPLE', '0900BABABFI', 'unidad', 0, 3, 0, 180000, true),
(5, 'BARRA DE BAÑO INOXIDABLE (variantes largo)', 'BARRAINO', 'unidad', 0, 2, 0, 441200, true),
(5, 'BARRA DE SUJECIÓN EN L DE 80 CM', 'LK40183', 'unidad', 0, 2, 0, 966600, true),
(5, 'BARRA DE BAÑO DE PVC', 'fy6700', 'unidad', 0, 2, 0, 165000, true),
(5, 'Botón S.O.S Premium con SIM CARD', '16MSBESIMCAR', 'unidad', 0, 2, 0, 1300000, true),
(5, 'Botón S.O.S.', '16MSBEESTEQ', 'unidad', 0, 2, 0, 650000, true),
(5, 'Botón S.O.S. Adicional', '16MSBEBADIC', 'unidad', 0, 3, 0, 250000, true),
(5, 'CAMA ARTICULADA ELÉCTRICA', '2000CA3MOVE', 'unidad', 0, 1, 0, 6250000, true),
(5, 'CAMA ARTICULADA MANUAL', '2000CA2MOVM', 'unidad', 0, 1, 0, 4100000, true),
(5, 'COLCHÓN ANTIESCARA NIVEL 3', 'COLAN3', 'unidad', 0, 1, 0, 4000000, true),
(5, 'COLCHÓN ORTOPÉDICO CON CUATRO SECCIONES', '2000CO4SFC14', 'unidad', 0, 1, 0, 800000, true),
(5, 'COLCHÓN DE AIRE CON COMPRESOR', '1000COCAAES', 'unidad', 0, 2, 0, 500000, true),
(5, 'Colchoneta Terapéutica Beige', 'COLTERBEI', 'unidad', 0, 1, 0, 0, true),
(5, 'Almohada cervical anti-ronquidos', '23XEALR5035', 'unidad', 0, 3, 0, 329500, true),
(5, 'Almohada con gel visoeléstica redonda', '0900ALGVRED', 'unidad', 0, 3, 0, 160000, true),
(5, 'Almohada cuña multiposición', '23XEALM5046', 'unidad', 0, 3, 0, 329500, true),
(5, 'Almohada Hemorroides', '23XEAL40369', 'unidad', 0, 3, 0, 304000, true),
(5, 'Almohada multiposición redondeado', '23XEALMREDON', 'unidad', 0, 3, 0, 304000, true),
(5, 'Almohada para entre piernas', '0900ALEPIERN', 'unidad', 0, 3, 0, 80000, true),
(5, 'Almohada para entre piernas entero', '23XEALVISFIJ', 'unidad', 0, 3, 0, 304000, true),
(5, 'Almohada para entre piernas forma de corazón', '23XEAL282016', 'unidad', 0, 3, 0, 304000, true),
(5, 'Almohada viscoelástica con gel en forma de U', '0900ALGVERG', 'unidad', 0, 3, 0, 160000, true),
(5, 'ALMOHADA COMODÍN', '0900ALC45455', 'unidad', 0, 3, 0, 120000, true),
(5, 'ALMOHADA SILICONA CUADRADA', '0900ALS4040', 'unidad', 0, 3, 0, 196000, true),
(5, 'ALMOHADA SILICONA CUADRADA C/ ORIFICIO', 'ACO', 'unidad', 0, 3, 0, 0, true),
(5, 'ALMOHADA DE VELLÓN SILICONADA REDONDA', '0900AL38168', 'unidad', 0, 3, 0, 185000, true),
(5, 'Cojín de gel con funda negra', '0900ALCOG9G', 'unidad', 0, 3, 0, 100000, true),
(5, 'Rollo cervical', '23XEAL4012CM-1', 'unidad', 0, 3, 0, 253000, true),
(5, 'Rollo circular', '23XEAL4012CM', 'unidad', 0, 3, 0, 176500, true),
(5, 'Talonera cuasicircular', '23XEALCUASIC', 'unidad', 0, 3, 0, 164000, true),
(5, 'Tutor anti-escara', '23XEALT4538', 'unidad', 0, 3, 0, 304000, true),
(5, 'APOYA TALÓN', 'AT', 'unidad', 0, 3, 0, 0, true),
(5, 'ELEVADOR DE INODORO BLANCO', '0900ESE10CM', 'unidad', 0, 2, 0, 310000, true),
(5, 'PEDAL PARA FISIOTERAPIA PLEGABLE', '0900PEPPLEG', 'unidad', 0, 2, 0, 303000, true),
(5, 'PEDAL PARA FISIOTERAPIA PLEGABLE CUENTA CALORÍAS', '0900PEPLCCC', 'unidad', 0, 2, 0, 450000, true),
(5, 'SILLA DE RUEDAS', '1000SSSRP120', 'unidad', 0, 1, 0, 1990000, true),
(5, 'SILLA DE RUEDAS ESTÁNDAR', '0900SRESTCR', 'unidad', 0, 1, 0, 1250000, true),
(5, 'SILLA DE RUEDAS REFORZADA', '1000SSSRP130', 'unidad', 0, 1, 0, 2185000, true),
(5, 'SILLA SANITARIA NACIONAL', '0900SSNACSR', 'unidad', 0, 2, 0, 400000, true),
(5, 'SILLA SANITARIA NACIONAL BLANCA', '10MMSSBLBEC', 'unidad', 0, 2, 0, 400000, true),
(5, 'SILLA SANITARIA NACIONAL CON RUEDAS', '0900SSNACCR', 'unidad', 0, 2, 0, 450000, true),
(5, 'SILLA SANITARIA ALTURA REGULABLE', '2000SSGARSR', 'unidad', 0, 2, 0, 485000, true),
(5, 'SILLA SANITARIA FIJA REGULABLE', 'FY810', 'unidad', 0, 2, 0, 750000, true),
(5, 'SILLA DE DUCHA CON RESPALDO', '10INSDSCRES', 'unidad', 0, 2, 0, 350000, true),
(5, 'Silla de ducha sin respaldo', '10INSDSSRES', 'unidad', 0, 2, 0, 300000, true),
(5, 'Mesa sobrecama', 'MESASOBRE', 'unidad', 0, 1, 0, 680000, true),

-- ─────────────────────────────────────────────
-- SILLÓN (category_id = 6)
-- ─────────────────────────────────────────────
(6, 'Sillón Reclinable Beige', '2000COSIREC', 'unidad', 0, 1, 0, 1600000, true)

ON CONFLICT (sku) DO NOTHING;
