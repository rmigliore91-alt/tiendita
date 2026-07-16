const express = require('express');
const { verifyJWT, requireAdmin } = require('../middleware/auth');
const {
  listUsers, createUser, updateUser, deactivateUser, activateUser,
} = require('../controllers/usersController');

const router = express.Router();

router.use(verifyJWT, requireAdmin);

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/deactivate', deactivateUser);
router.patch('/:id/activate', activateUser);

module.exports = router;
