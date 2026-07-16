const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const { rows } = await pool.query(
      'SELECT id, name, email, password_hash, role, active FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    if (!user.active) {
      return res.status(401).json({ error: 'Usuario desactivado. Contacte al administrador' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, me };
