const express = require('express');
const { verifyJWT } = require('../middleware/auth');
const {
  listContacts, searchContacts, getContact,
  getContactHistory, createContact, updateContact, deleteContact,
} = require('../controllers/contactsController');

const router = express.Router();
router.use(verifyJWT);

router.get('/search', searchContacts);
router.get('/', listContacts);
router.get('/:id', getContact);
router.get('/:id/history', getContactHistory);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

module.exports = router;
