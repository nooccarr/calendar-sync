const openDentalApiService = require('../thirdParty/openDentalApiService');
const { apiErrorLogger, apiErrorHandler } = require('../helpers/lib/error');

const getPatients = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });

  try {
    const patients = await openDentalApiService.listPatients(req.query, auth);
    res.json(patients);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getPatient = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { PatNum } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!PatNum)
    return res.status(400).json({ message: 'Require patient ID' });

  try {
    const patient = await openDentalApiService.listPatient(PatNum, auth);
    res.json(patient);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointments = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });

  try {
    const appointments = await openDentalApiService.listAppointments(req.query, auth);
    res.json(appointments);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointment = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { AptNum } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!AptNum)
    return res.status(400).json({ message: 'Require appointment ID' });

  try {
    const appointment = await openDentalApiService.listAppointment(AptNum, auth);
    res.json(appointment);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const createPatient = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { LName, FName } = req.body;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!LName || !FName)
    return res.status(400).json({ message: 'Require first name and last name' });

  try {
    const patient = await openDentalApiService.createNewPatient(req.body, auth);
    res.json(patient);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const createAppointment = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { PatNum, AptDateTime, AppointmentTypeNum, Op } = req.body;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!PatNum || !AptDateTime || !AppointmentTypeNum || !Op)
    return res.status(400).json({ message: 'Require patient number, appointment date time, appointment type number, and operatory' });

  try {
    const appointment = await openDentalApiService.createNewAppointment(req.body, auth);
    res.json(appointment);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const updatePatient = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { PatNum } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!PatNum)
    return res.status(400).json({ message: 'Require patient ID' });

  try {
    const patient = await openDentalApiService.updatePatient(PatNum, req.body, auth);
    res.json(patient);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const updateAppointment = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { AptNum } = req.query;
  const { AptDateTime } = req.body;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!AptNum)
    return res.status(400).json({ message: 'Require appointment ID' });
  if (!AptDateTime)
    return res.status(400).json({ message: 'Require appointment date time' });

  try {
    const appointment = await openDentalApiService.updateAppointment(AptNum, req.body, auth);
    res.json({ message: `Updated an appointment with ID ${AptNum}` });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const breakAppointment = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { AptNum } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require OAuth Authentication' });
  if (!AptNum)
    return res.status(400).json({ message: 'Require appointment ID' });
  if (!('sendToUnscheduledList' in req.body))
    return res.status(400).json({ message: 'Require send to unscheduled list' })

  try {
    const appointment = await openDentalApiService.breakAppointment(AptNum, req.body, auth);
    res.json({ message: `Updated an appointment with ID ${AptNum}` });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

module.exports = {
  getPatients,
  getPatient,
  getAppointments,
  getAppointment,
  createPatient,
  createAppointment,
  updatePatient,
  updateAppointment,
  breakAppointment
};