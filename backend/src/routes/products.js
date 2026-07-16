const express = require('express');
const { verifyJWT, requireAdmin } = require('../middleware/auth');
const {
  listProducts, getProduct, createProduct, updateProduct,
  deactivateProduct, activateProduct, getDashboardStats,
} = require('../controllers/productsController');

const router = express.Router();

router.use(verifyJWT);

router.get('/dashboard-stats', getDashboardStats);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireAdmin, createProduct);
router.put('/:id', requireAdmin, updateProduct);
router.patch('/:id/deactivate', requireAdmin, deactivateProduct);
router.patch('/:id/activate', requireAdmin, activateProduct);

module.exports = router;
