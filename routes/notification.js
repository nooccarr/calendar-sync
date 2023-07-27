const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/notificationController');

router.route('/')
  .post(handleWebhook);

module.exports = router;