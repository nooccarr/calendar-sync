const express = require('express');
const router = express.Router();
const notificationService = require('../../services/notificationService');

router.route('/')
  .post(notificationService.handleWebhook);

module.exports = router;