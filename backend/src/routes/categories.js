const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const { listCategories } = require('../controllers/categoriesController');

const router = express.Router();

router.get('/', verifyJWT, listCategories);

module.exports = router;
