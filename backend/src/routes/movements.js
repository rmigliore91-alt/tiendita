const express = require('express');
const { verifyJWT, requireOperatorOrAdmin } = require('../middleware/auth');
const {
  listMovements, createMovement, exportCSV, recentMovements,
} = require('../controllers/movementsController');

const router = express.Router();

router.use(verifyJWT);

router.get('/export', exportCSV);
router.get('/recent', recentMovements);
router.get('/', listMovements);
// Admin, operator and marketing can register stock movements
router.post('/', requireOperatorOrAdmin, createMovement);

module.exports = router;
