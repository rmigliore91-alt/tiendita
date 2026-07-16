/**
 * Central error handler middleware.
 * Must be registered last in Express app.
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message || err);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único (ej. SKU o email duplicado)' });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida: el registro relacionado no existe' });
  }

  // Postgres check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Valor fuera de rango o no permitido' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = errorHandler;
