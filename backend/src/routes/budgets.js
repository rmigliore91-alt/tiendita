const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { createBudget, listBudgets } = require('../controllers/budgetsController');

const router = express.Router();
router.use(verifyJWT);

router.get('/', listBudgets);
router.post('/', createBudget);

module.exports = router;
