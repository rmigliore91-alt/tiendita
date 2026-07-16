const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/**
 * GET /api/users
 */
async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/users
 * Body: { name, email, password, role }
 */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nombre, email, contraseña y rol son requeridos' });
    }
    if (!['admin', 'operator', 'marketing'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido. Use "admin", "operator" o "marketing"' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, rounds);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, active, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/:id
 * Body: { name, role }
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    if (role && !['admin', 'operator', 'marketing'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const { rows } = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           role = COALESCE($2, role)
       WHERE id = $3
       RETURNING id, name, email, role, active, created_at`,
      [name?.trim() || null, role || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id/deactivate
 */
async function deactivateUser(req, res, next) {
  try {
    const { id } = req.params;
    // Prevent self-deactivation
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puede desactivar su propia cuenta' });
    }
    const { rows } = await pool.query(
      `UPDATE users SET active = FALSE WHERE id = $1
       RETURNING id, name, email, role, active`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id/activate
 */
async function activateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE users SET active = TRUE WHERE id = $1
       RETURNING id, name, email, role, active`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, createUser, updateUser, deactivateUser, activateUser };
