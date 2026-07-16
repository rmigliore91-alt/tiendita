const pool = require('../config/db');

/**
 * GET /api/contacts
 * Query: ?search=&page=&limit=&active=
 */
async function listContacts(req, res, next) {
  try {
    const { search, active } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (active !== undefined && active !== '') {
      params.push(active === 'true');
      conditions.push(`c.active = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(c.name ILIKE $${params.length} OR c.ruc ILIKE $${params.length} OR c.phone1 ILIKE $${params.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM contacts c ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.ruc, c.email, c.phone1, c.phone2, c.address, c.notes, c.active, c.created_at
       FROM contacts c
       ${where}
       ORDER BY c.name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/contacts/search?q= (lightweight, for autocomplete)
 */
async function searchContacts(req, res, next) {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);
    const { rows } = await pool.query(
      `SELECT id, name, ruc, phone1, phone2, address, email
       FROM contacts
       WHERE active = TRUE
         AND (name ILIKE $1 OR ruc ILIKE $1 OR phone1 ILIKE $1)
       ORDER BY name ASC
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/contacts/:id
 */
async function getContact(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, ruc, email, phone1, phone2, address, notes, active, created_at
       FROM contacts WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/contacts/:id/history
 * Returns budgets issued for this contact, with items.
 */
async function getContactHistory(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM budgets WHERE contact_id = $1`,
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows: budgets } = await pool.query(
      `SELECT b.id, b.subtotal, b.delivery_cost, b.total,
              b.with_delivery, b.distance_km, b.client_name,
              b.notes, b.created_at,
              u.name AS user_name
       FROM budgets b
       JOIN users u ON u.id = b.user_id
       WHERE b.contact_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    // Attach items to each budget
    if (budgets.length) {
      const budgetIds = budgets.map((b) => b.id);
      const { rows: items } = await pool.query(
        `SELECT budget_id, product_name, sku, quantity, unit_price, subtotal
         FROM budget_items
         WHERE budget_id = ANY($1)
         ORDER BY id ASC`,
        [budgetIds]
      );
      const itemsByBudget = {};
      items.forEach((it) => {
        if (!itemsByBudget[it.budget_id]) itemsByBudget[it.budget_id] = [];
        itemsByBudget[it.budget_id].push(it);
      });
      budgets.forEach((b) => { b.items = itemsByBudget[b.id] || []; });
    }

    res.json({ data: budgets, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/contacts
 */
async function createContact(req, res, next) {
  try {
    const { name, ruc, email, phone1, phone2, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });

    const { rows } = await pool.query(
      `INSERT INTO contacts (name, ruc, email, phone1, phone2, address, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        name.trim(),
        ruc?.trim()     || null,
        email?.trim()   || null,
        phone1?.trim()  || null,
        phone2?.trim()  || null,
        address?.trim() || null,
        notes?.trim()   || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/contacts/:id
 */
async function updateContact(req, res, next) {
  try {
    const { name, ruc, email, phone1, phone2, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });

    const { rows } = await pool.query(
      `UPDATE contacts
       SET name=$1, ruc=$2, email=$3, phone1=$4, phone2=$5, address=$6, notes=$7
       WHERE id=$8
       RETURNING *`,
      [
        name.trim(),
        ruc?.trim()     || null,
        email?.trim()   || null,
        phone1?.trim()  || null,
        phone2?.trim()  || null,
        address?.trim() || null,
        notes?.trim()   || null,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/contacts/:id
 * Soft-delete: sets active=false if the contact has budgets, hard-delete otherwise.
 */
async function deleteContact(req, res, next) {
  try {
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM budgets WHERE contact_id = $1`,
      [req.params.id]
    );
    if (parseInt(count) > 0) {
      // Soft delete
      const { rows } = await pool.query(
        `UPDATE contacts SET active=FALSE WHERE id=$1 RETURNING id`,
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });
      return res.json({ message: 'Contacto desactivado (tiene historial de presupuestos)' });
    }
    const { rows } = await pool.query(
      `DELETE FROM contacts WHERE id=$1 RETURNING id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });
    res.json({ message: 'Contacto eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listContacts,
  searchContacts,
  getContact,
  getContactHistory,
  createContact,
  updateContact,
  deleteContact,
};
