const openDentalApiHelpers = require('../helpers/openDentalApiHelpers');
const { apiErrorHandler, apiErrorLogger } = require('../utils/index').Error;

const getPatients = async (req, res) => {
  const { data } = await openDentalApiHelpers.listPatients(req.query);

  return data;
};

const getPatient = async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) throw Error('Patient number required');

  const { data } = await openDentalApiHelpers.listPatient(PatNum);

  return data;
};

const getAppointments = async (req, res) => {
  const { data } = await openDentalApiHelpers.listAppointments(req.query);

  return data;
};

const getAppointment = async (req, res) => {
  const { AptNum } = req.query;

  if (!AptNum) throw Error('Appointment number required');

  const { data } = await openDentalApiHelpers.listAppointment(AptNum);

  return data;
};

const createPatient = async (req, res) => {
  const { LName, FName, Birthdate } = req.body;

  if (!LName || !FName) throw Error('Last name and first name are required');

  if (!Birthdate) req.body.Birthdate = '0001-01-01';

  const { data } = await openDentalApiHelpers.createNewPatient(req.body);

  return data; // automatically ignores duplicates
};

const createAppointment = async (req, res) => {
  const { PatNum, AptDateTime } = req.body; // AppointmentTypeNum: 2 ~ 5

  if (!PatNum || !AptDateTime) {
    throw Error('Patient number and appointment date & time required');
  }

  const { data } = await openDentalApiHelpers.createNewAppointment(req.body);

  return data;
};

const updateAppointment = async (req, res) => {
  const { AptNum } = req.query;
  const { AptDateTime } = req.body;

  if (!AptNum) throw Error('Appointment number required');
  if (!AptDateTime) throw Error('Appointment date & time required');

  await openDentalApiHelpers.updateAppointment(AptNum, req.body);
};

const breakAppointment = async (req, res) => {
  const { AptNum } = req.query;
  const { sendToUnscheduledList } = req.body;

  if (!AptNum) throw Error('Appointment number required');
  if (sendToUnscheduledList === undefined) throw Error('Send to unscheduled list required');

  await openDentalApiHelpers.breakAppointment(AptNum, req.body);
};

const updatePatient = async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) throw Error('Patient number required');

  const { data } = await openDentalApiHelpers.updatePatient(PatNum, req.body);

  return data;
};

module.exports = {
  getPatients,
  getPatient,
  getAppointments,
  getAppointment,
  createPatient,
  createAppointment,
  updateAppointment,
  breakAppointment,
  updatePatient
};