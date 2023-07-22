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

  if (!LName || !FName) return res.status(400).json({ message: 'Last name and first name are required' });

  if (!Birthdate) req.body.Birthdate = '0001-01-01';

  try {
    const { data } = await openDentalApiHelpers.createNewPatient(req.body);

    res.status(201).json(data); // automatically ignores duplicates
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const createAppointment = async (req, res) => {
  const { PatNum, AptDateTime } = req.body; // AppointmentTypeNum: 2 ~ 5

  if (!PatNum || !AptDateTime) {
    return res.status(400).json({ message: 'Patient number and appointment date & time required' });
  }

  req.body.Op = 1;

  try {
    const { data } = await openDentalApiHelpers.createNewAppointment(req.body);

    res.status(201).json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const updateAppointment = async (req, res) => {
  const { AptNum } = req.query;
  const { AptDateTime } = req.body;

  if (!AptNum) return res.status(400).json({ message: 'Appointment number required' });
  if (!AptDateTime) return res.status(400).json({ message: 'Appointment date & time required' });

  try {
    const response = await openDentalApiHelpers.updateAppointment(AptNum, req.body);

    res.json({ message: `Updated an appointment with the id '${AptNum}'` }); // AptDateTime(ASC)
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const breakAppointment = async (req, res) => {
  const { AptNum } = req.query;
  const { sendToUnscheduledList } = req.body;

  if (!AptNum) return res.status(400).json({ message: 'Appointment number required' });
  if (!sendToUnscheduledList) return res.status(400).json({ message: 'Send to unscheduled list required' });

  try {
    const response = await openDentalApiHelpers.breakAppointment(AptNum, req.body);

    res.json({ message: `Broke an appointment with the id '${id}'` });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
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