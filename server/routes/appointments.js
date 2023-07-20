const express = require('express');
const router = express.Router();
const opendentalController = require('../controllers/appointmentsController');

router.route('/')
  .get()
  .post()
  .delete();

module.exports = router;