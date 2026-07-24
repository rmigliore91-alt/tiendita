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
          with_delivery, distance_km, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')
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
              b.distance_km, b.notes, b.status, b.created_at,
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

/**
 * POST /api/budgets/:id/confirm-sale
 * Body: { sale_type: 'interna' | 'externa' }
 * Creates SALIDA movements for each budget item and marks budget as confirmed.
 * Atomic transaction — rolls back entirely if any item has insufficient stock.
 */
async function confirmSale(req, res, next) {
  const client = await pool.connect();
  try {
    const budgetId = parseInt(req.params.id);
    const { sale_type } = req.body;

    if (!['interna', 'externa'].includes(sale_type)) {
      return res.status(400).json({ error: 'Debe indicar el destino de venta: interna o externa' });
    }

    await client.query('BEGIN');

    // Load budget and validate
    const { rows: [budget] } = await client.query(
      'SELECT * FROM budgets WHERE id = $1 FOR UPDATE',
      [budgetId]
    );
    if (!budget) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    if (budget.status === 'confirmed') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Este presupuesto ya fue confirmado como venta' });
    }

    // Load budget items
    const { rows: items } = await client.query(
      'SELECT * FROM budget_items WHERE budget_id = $1',
      [budgetId]
    );
    if (!items.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El presupuesto no tiene ítems' });
    }

    const movements = [];

    for (const item of items) {
      if (!item.product_id) continue; // skip items without linked product

      const qty = parseInt(item.quantity);

      // Lock product row and validate stock
      const { rows: [product] } = await client.query(
        'SELECT id, name, stock_current, active FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );
      if (!product) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto no encontrado: ${item.product_name}` });
      }
      if (!product.active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `El producto "${product.name}" está inactivo` });
      }
      if (product.stock_current < qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para "${product.name}". Stock actual: ${product.stock_current}, requerido: ${qty}`,
        });
      }

      const unitPriceInt = parseInt(item.unit_price) || 0;
      const totalPrice   = qty * unitPriceInt;

      // Create SALIDA movement
      const { rows: [movement] } = await client.query(
        `INSERT INTO movements
           (product_id, user_id, type, quantity, unit_price, total_price, sale_type, notes, budget_id)
         VALUES ($1, $2, 'SALIDA', $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          item.product_id,
          req.user.id,
          qty,
          unitPriceInt,
          totalPrice,
          sale_type,
          `Confirmación de presupuesto #${budgetId}`,
          budgetId,
        ]
      );

      // Update stock
      await client.query(
        'UPDATE products SET stock_current = stock_current - $1 WHERE id = $2',
        [qty, item.product_id]
      );

      movements.push(movement);
    }

    // Mark budget as confirmed
    await client.query(
      "UPDATE budgets SET status = 'confirmed' WHERE id = $1",
      [budgetId]
    );

    await client.query('COMMIT');

    res.json({
      message: `Venta confirmada. ${movements.length} movimiento(s) de salida registrados.`,
      movements,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { createBudget, listBudgets, confirmSale };
