const express = require('express');
const router = express.Router();
const acuityController = require('../controllers/acuityController');

router.route('/webhook')
  .get()
  .post();

router.route('/webhook/:id')
  .delete();

router.route('/appointments')
  .get();

router.route('/appointments/:id')
  .get();

router.route('/appointment-types')
  .get();

router.route('/calendars')
  .get();

router.route('/forms')
  .get();

module.exports = router;