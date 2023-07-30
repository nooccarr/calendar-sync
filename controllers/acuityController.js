const acuityWebhookService = require('../thirdParty/acuityWebhookService');
const acuityApiService = require('../thirdParty/acuityApiService');
const { apiErrorHandler, apiErrorLogger } = require('../helpers/index').Error;

const getWebhooks = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });

  try {
    const webhooks = await acuityWebhookService.listActiveWebhooks(auth);
    res.json(webhooks);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const createWebhook = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { event, target } = req.body;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });
  if (!event || !target)
    return res.status(400).json({ message: 'Require event and target' });

  try {
    const webhook = await acuityWebhookService.createNewWebhook(event, target, auth);
    res.json(webhook);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const deleteWebhook = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { id } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });
  if (!id)
    return res.status(400).json({ message: 'Require webhook ID' });

  try {
    const result = await acuityWebhookService.deleteWebhook(id, auth);
    res.json({ message: `Deleted a webhook with ID ${id}` });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointments = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });

  try {
    const appointments = await acuityApiService.listAppointments(req.query, auth);
    res.json(appointments);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointment = async (req, res) => {
  const { authorization: auth } = req.headers;
  const { id } = req.query;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });
  if (!id)
    return res.status(400).json({ message: 'Require appointment ID' });

  try {
    const appointment = await acuityApiService.listAppointmentById({ id }, auth);
    res.json(appointment);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointmentTypes = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });

  try {
    const appointmentTypes = await acuityApiService.listAppointmentTypes(req.query, auth);
    res.json(appointmentTypes);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getCalendars = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });

  try {
    const calendars = await acuityApiService.listCalendars(auth);
    res.json(calendars);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getForms = async (req, res) => {
  const { authorization: auth } = req.headers;

  if (!auth)
    return res.status(400).json({ message: 'Require Basic Authentication' });

  try {
    const forms = await acuityApiService.listForms(auth);
    res.json(forms);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

module.exports = {
  getWebhooks,
  createWebhook,
  deleteWebhook,
  getAppointments,
  getAppointment,
  getAppointmentTypes,
  getCalendars,
  getForms
};