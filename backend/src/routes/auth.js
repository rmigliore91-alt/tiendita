const express = require('express');
const { login, me } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', verifyJWT, me);

module.exports = router;
