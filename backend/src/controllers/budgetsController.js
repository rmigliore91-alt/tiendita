const pool = require('../config/db');

/**
 * POST /api/budgets
 * Body: { contact_id?, client_name, client_phone, items[], with_delivery, distance_km, delivery_cost, subtotal, total, notes }
 */
async function createBudget(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      contact_id, client_name, client_phone,
      items, with_delivery, distance_km,
      subtotal, delivery_cost, total, notes,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'El presupuesto debe tener al menos un ítem' });
    }

    await client.query('BEGIN');

    const { rows: [budget] } = await client.query(
      `INSERT INTO budgets
         (contact_id, user_id, client_name, client_phone, subtotal, delivery_cost, total,
          with_delivery, distance_km, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        contact_id || null,
        req.user.id,
        client_name?.trim() || null,
        client_phone?.trim() || null,
        parseInt(subtotal)      || 0,
        parseInt(delivery_cost) || 0,
        parseInt(total)         || 0,
        !!with_delivery,
        distance_km ? parseFloat(distance_km) : null,
        notes?.trim() || null,
      ]
    );

    // Insert items
    for (const item of items) {
      await client.query(
        `INSERT INTO budget_items (budget_id, product_id, product_name, sku, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          budget.id,
          item.product_id || null,
          item.product_name,
          item.sku || null,
          parseInt(item.quantity),
          parseInt(item.unit_price) || 0,
          parseInt(item.quantity) * (parseInt(item.unit_price) || 0),
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(budget);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

/**
 * GET /api/budgets
 * Query: ?contact_id=&page=&limit=
 */
async function listBudgets(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    if (req.query.contact_id) {
      params.push(parseInt(req.query.contact_id));
      conditions.push(`b.contact_id = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM budgets b ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT b.id, b.contact_id, b.client_name, b.client_phone,
              b.subtotal, b.delivery_cost, b.total, b.with_delivery,
              b.distance_km, b.notes, b.created_at,
              u.name AS user_name
       FROM budgets b
       JOIN users u ON u.id = b.user_id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBudget, listBudgets };
