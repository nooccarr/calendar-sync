const express = require('express');
const router = express.Router();
const acuityController = require('../../controllers/acuityController');

router.route('/webhook')
  .get(acuityController.getWebhooks)
  .post(acuityController.createWebhook);

router.route('/webhook/:id')
  .delete(acuityController.deleteWebhook);

router.route('/appointments')
  .get(acuityController.getAppointments);

router.route('/appointments/:id')
  .get(acuityController.getAppointment);

router.route('/appointment-types')
  .get(acuityController.getAppointmentTypes);

router.route('/calendars')
  .get(acuityController.getCalendars);

router.route('/forms')
  .get(acuityController.getForms);

module.exports = router;