const express = require('express');
const router = express.Router();
const { populateDatabase } = require('../controllers/populateController');

router.route('/')
  .post(populateDatabase);

module.exports = router;