const express = require('express');
const router = express.Router();
const populateService = require('../../services/populateService');

router.route('/')
  .post(populateService.populateDatabase);

module.exports = router;