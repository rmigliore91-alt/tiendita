const pool = require('../config/db');
const { Parser } = require('json2csv');

/**
 * Build the WHERE clause for movement queries from query params.
 */
function buildFilters(query) {
  const { product_id, category_id, type, user_id, date_from, date_to, sale_type } = query;
  const conditions = [];
  const params = [];

  if (product_id) {
    params.push(parseInt(product_id));
    conditions.push(`m.product_id = $${params.length}`);
  }
  if (category_id) {
    params.push(parseInt(category_id));
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (type && ['ENTRADA', 'SALIDA'].includes(type)) {
    params.push(type);
    conditions.push(`m.type = $${params.length}`);
  }
  if (sale_type && ['interna', 'externa'].includes(sale_type)) {
    params.push(sale_type);
    conditions.push(`m.sale_type = $${params.length}`);
  }
  if (user_id) {
    params.push(parseInt(user_id));
    conditions.push(`m.user_id = $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`m.created_at >= $${params.length}::timestamptz`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`m.created_at < ($${params.length}::date + interval '1 day')`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

const BASE_SELECT = `
  SELECT
    m.id, m.type, m.quantity, m.unit_price, m.total_price,
    m.sale_type, m.notes, m.created_at,
    p.id AS product_id, p.name AS product_name, p.sku,
    c.id AS category_id, c.name AS category_name,
    u.id AS user_id, u.name AS user_name
  FROM movements m
  JOIN products p ON p.id = m.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN users u ON u.id = m.user_id
`;

/**
 * GET /api/movements
 * Query: product_id, category_id, type, user_id, date_from, date_to, page, limit
 */
async function listMovements(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const { where, params } = buildFilters(req.query);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM movements m
       JOIN products p ON p.id = m.product_id
       JOIN categories c ON c.id = p.category_id
       JOIN users u ON u.id = m.user_id
       ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataParams = [...params, limit, offset];
    const { rows } = await pool.query(
      `${BASE_SELECT} ${where}
       ORDER BY m.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/movements
 * Body: { product_id, type, quantity, unit_price, notes }
 * Updates product stock_current atomically in a transaction.
 */
async function createMovement(req, res, next) {
  const client = await pool.connect();
  try {
    const { product_id, type, quantity, unit_price, notes, sale_type } = req.body;

    if (!product_id || !type || !quantity) {
      return res.status(400).json({ error: 'Producto, tipo y cantidad son requeridos' });
    }
    if (!['ENTRADA', 'SALIDA'].includes(type)) {
      return res.status(400).json({ error: 'Tipo debe ser ENTRADA o SALIDA' });
    }
    // sale_type required for SALIDA
    if (type === 'SALIDA' && !['interna', 'externa'].includes(sale_type)) {
      return res.status(400).json({ error: 'Para una SALIDA debe indicar si es venta interna o externa' });
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número positivo' });
    }

    await client.query('BEGIN');

    // Lock the product row
    const { rows: [product] } = await client.query(
      'SELECT id, name, stock_current, active FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );
    if (!product) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    if (!product.active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El producto está inactivo' });
    }

    // Validate stock for SALIDA
    if (type === 'SALIDA' && product.stock_current < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Stock insuficiente. Stock actual: ${product.stock_current}, solicitado: ${qty}`,
      });
    }

    const unitPriceInt = parseInt(unit_price) || 0;
    const totalPrice = qty * unitPriceInt;
    const delta = type === 'ENTRADA' ? qty : -qty;
    const saleTypeVal = type === 'SALIDA' ? sale_type : null;

    // Insert movement
    const { rows: [movement] } = await client.query(
      `INSERT INTO movements (product_id, user_id, type, quantity, unit_price, total_price, sale_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [product_id, req.user.id, type, qty, unitPriceInt, totalPrice, saleTypeVal, notes?.trim() || null]
    );

    // Update stock
    await client.query(
      'UPDATE products SET stock_current = stock_current + $1 WHERE id = $2',
      [delta, product_id]
    );

    await client.query('COMMIT');
    res.status(201).json(movement);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/movements/export
 * Returns CSV file with current filters applied.
 */
async function exportCSV(req, res, next) {
  try {
    const { where, params } = buildFilters(req.query);

    const { rows } = await pool.query(
      `${BASE_SELECT} ${where} ORDER BY m.created_at DESC LIMIT 10000`,
      params
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'No hay datos para exportar' });
    }

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Fecha', value: (row) => new Date(row.created_at).toLocaleString('es-PY') },
      { label: 'Tipo', value: 'type' },
      { label: 'Destino Venta', value: (row) => row.sale_type === 'interna' ? 'Interna (Residentes)' : row.sale_type === 'externa' ? 'Externa (Ajenos/Colaboradores)' : '' },
      { label: 'Producto', value: 'product_name' },
      { label: 'SKU', value: 'sku' },
      { label: 'Categoría', value: 'category_name' },
      { label: 'Cantidad', value: 'quantity' },
      { label: 'Precio Unitario (PYG)', value: 'unit_price' },
      { label: 'Total (PYG)', value: 'total_price' },
      { label: 'Usuario', value: 'user_name' },
      { label: 'Notas', value: 'notes' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="movimientos.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/movements/recent
 * Returns last 10 movements for the dashboard feed.
 */
async function recentMovements(req, res, next) {
  try {
    const { rows } = await pool.query(
      `${BASE_SELECT} ORDER BY m.created_at DESC LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMovements, createMovement, exportCSV, recentMovements };
