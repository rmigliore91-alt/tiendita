const express = require('express');
const { verifyJWT, requireAdmin, requireRoles } = require('../middleware/auth');
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
// Admin and marketing can edit product data (stock only changes via movements)
router.put('/:id', requireRoles('admin', 'marketing'), updateProduct);
router.patch('/:id/deactivate', requireAdmin, deactivateProduct);
router.patch('/:id/activate', requireAdmin, activateProduct);

module.exports = router;
