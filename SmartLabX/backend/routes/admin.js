const express = require('express');
const router = express.Router();
const { getUsers, createUser } = require('../controllers/adminController');

router.route('/users')
  .get(getUsers)
  .post(createUser);

module.exports = router;
