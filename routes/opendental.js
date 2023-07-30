const express = require('express');
const router = express.Router();
const openDentalController = require('../controllers/openDentalController');

router.route('/patients')
  .get(openDentalController.getPatients)
  .post(openDentalController.createPatient);

router.route('/patients/:id')
  .get(openDentalController.getPatient)
  .put(openDentalController.updatePatient);

router.route('/appointments')
  .get(openDentalController.getAppointments)
  .post(openDentalController.createAppointment);

router.route('/appointments/:id')
  .get(openDentalController.getAppointment)
  .put(openDentalController.updateAppointment);

router.route('/appointments/:id/break')
  .put(openDentalController.breakAppointment);

module.exports = router;