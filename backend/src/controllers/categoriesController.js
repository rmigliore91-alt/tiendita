const pool = require('../config/db');

/**
 * GET /api/categories
 */
async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories };
