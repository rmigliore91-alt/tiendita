require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

const authRoutes       = require('./routes/auth');
const usersRoutes      = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const productsRoutes   = require('./routes/products');
const movementsRoutes  = require('./routes/movements');
const contactsRoutes   = require('./routes/contacts');
const budgetsRoutes    = require('./routes/budgets');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products',   productsRoutes);
app.use('/api/movements',  movementsRoutes);
app.use('/api/contacts',   contactsRoutes);
app.use('/api/budgets',    budgetsRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Serve React frontend in production ───────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  // SPA fallback: all non-API routes return index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Tiendita API running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
});
