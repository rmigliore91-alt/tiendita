const pool = require('../config/db');

/**
 * GET /api/products
 * Query: ?category_id=&category=&active=&low_stock=&search=&page=&limit=&sort_by=&order=
 * Without page/limit → returns flat array (backward-compatible for dropdowns).
 * With page/limit    → returns { data, total, page, totalPages }.
 */
async function listProducts(req, res, next) {
  try {
    // Support both ?category_id= (new) and ?category= (legacy)
    const { active, low_stock, search } = req.query;
    const category = req.query.category_id || req.query.category;

    const conditions = [];
    const params = [];

    if (category) {
      params.push(parseInt(category));
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (active !== undefined && active !== '') {
      params.push(active === 'true');
      conditions.push(`p.active = $${params.length}`);
    }
    if (low_stock === 'true') {
      conditions.push(`p.stock_current <= p.stock_minimum`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist sortable columns to prevent SQL injection
    const SORT_MAP = {
      name:          'p.name',
      sku:           'p.sku',
      category_name: 'c.name',
      unit:          'p.unit',
      stock_current: 'p.stock_current',
      stock_minimum: 'p.stock_minimum',
      sale_price:    'p.sale_price',
      active:        'p.active',
    };
    const sortCol   = SORT_MAP[req.query.sort_by] || null;
    const sortOrder = req.query.order === 'desc' ? 'DESC' : 'ASC';
    const orderBy   = sortCol
      ? `${sortCol} ${sortOrder}`
      : 'c.name ASC, p.name ASC';  // default

    const baseSelect = `
      SELECT p.id, p.name, p.sku, p.unit,
             p.stock_current, p.stock_minimum,
             p.cost_price, p.sale_price,
             p.active, p.created_at,
             c.id AS category_id, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY ${orderBy}`;

    // No pagination requested → flat array (backward-compatible)
    if (!req.query.page && !req.query.limit) {
      const { rows } = await pool.query(baseSelect, params);
      return res.json(rows);
    }

    // Paginated response
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `${baseSelect} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 */
async function getProduct(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.sku, p.unit,
              p.stock_current, p.stock_minimum,
              p.cost_price, p.sale_price,
              p.active, p.created_at,
              c.id AS category_id, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products
 */
async function createProduct(req, res, next) {
  try {
    const { category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price } = req.body;
    if (!category_id || !name || !sku || !unit) {
      return res.status(400).json({ error: 'Categoría, nombre, SKU y unidad son requeridos' });
    }

    const { rows } = await pool.query(
      `INSERT INTO products (category_id, name, sku, unit, stock_current, stock_minimum, cost_price, sale_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        category_id,
        name.trim(),
        sku.trim().toUpperCase(),
        unit.trim(),
        parseInt(stock_current) || 0,
        parseInt(stock_minimum) || 0,
        parseInt(cost_price) || 0,
        parseInt(sale_price) || 0,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/products/:id
 */
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { category_id, name, sku, unit, stock_minimum, cost_price, sale_price } = req.body;

    const { rows } = await pool.query(
      `UPDATE products
       SET category_id   = COALESCE($1, category_id),
           name          = COALESCE($2, name),
           sku           = COALESCE($3, sku),
           unit          = COALESCE($4, unit),
           stock_minimum = COALESCE($5, stock_minimum),
           cost_price    = COALESCE($6, cost_price),
           sale_price    = COALESCE($7, sale_price)
       WHERE id = $8
       RETURNING *`,
      [
        category_id || null,
        name?.trim() || null,
        sku?.trim().toUpperCase() || null,
        unit?.trim() || null,
        stock_minimum !== undefined ? parseInt(stock_minimum) : null,
        cost_price !== undefined ? parseInt(cost_price) : null,
        sale_price !== undefined ? parseInt(sale_price) : null,
        id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/products/:id/deactivate
 */
async function deactivateProduct(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET active = FALSE WHERE id = $1 RETURNING id, name, active`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/products/:id/activate
 */
async function activateProduct(req, res, next) {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET active = TRUE WHERE id = $1 RETURNING id, name, active`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/dashboard-stats
 */
async function getDashboardStats(req, res, next) {
  try {
    const { rows: [stats] } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE active)                                        AS total_active,
        COUNT(*) FILTER (WHERE active AND stock_current > stock_minimum)      AS stock_ok,
        COUNT(*) FILTER (WHERE active AND stock_current > 0
                              AND stock_current <= stock_minimum)             AS stock_low,
        COUNT(*) FILTER (WHERE active AND stock_current = 0)                 AS stock_zero,
        COALESCE(SUM(stock_current * cost_price) FILTER (WHERE active), 0)  AS total_value
      FROM products
    `);

    const { rows: lowStockProducts } = await pool.query(`
      SELECT p.id, p.name, p.sku, p.stock_current, p.stock_minimum, c.name AS category_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.active = TRUE AND p.stock_current <= p.stock_minimum
      ORDER BY p.stock_current ASC
      LIMIT 10
    `);

    res.json({ stats, lowStockProducts });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  activateProduct,
  getDashboardStats,
};
