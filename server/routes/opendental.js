const express = require('express');
const router = express.Router();
const opendentalController = require('../controllers/opendentalController');

router.route('/patients')
  .get()
  .post();

router.route('/patients/:id')
  .get()
  .put();

router.route('/appointments')
  .get()
  .post();

router.route('/appointments/:id')
  .get()
  .put();

router.route('/appointments/:id/break')
  .put();

module.exports = router;