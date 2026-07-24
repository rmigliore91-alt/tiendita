const express = require('express');
const { verifyJWT, requireOperatorOrAdmin } = require('../middleware/auth');
const { createBudget, listBudgets, confirmSale } = require('../controllers/budgetsController');

const router = express.Router();
router.use(verifyJWT);

router.get('/', listBudgets);
router.post('/', createBudget);
router.post('/:id/confirm-sale', requireOperatorOrAdmin, confirmSale);

module.exports = router;
