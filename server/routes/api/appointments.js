const express = require('express');
const router = express.Router();
const appointmentsController = require('../../controllers/appointmentsController');

router.route('/')
  .get(appointmentsController.getAppointments)
  .post(appointmentsController.createAppointment)
  .delete(appointmentsController.deleteAppointment);

module.exports = router;