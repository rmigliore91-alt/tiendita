const jwt = require('jsonwebtoken');

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches decoded payload to req.user on success.
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado: token requerido' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}

/**
 * Middleware: require admin role.
 * Must be used after verifyJWT.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
  }
  next();
}

/**
 * Middleware: require admin or operator role.
 * Blocks marketing role from stock movements.
 */
function requireOperatorOrAdmin(req, res, next) {
  const allowed = ['admin', 'operator'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({
      error: 'Acceso denegado: el rol marketing no puede registrar movimientos de stock',
    });
  }
  next();
}

module.exports = { verifyJWT, requireAdmin, requireOperatorOrAdmin };
