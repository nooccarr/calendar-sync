const acuityWebhookHelpers = require('../helpers/acuityWebhookHelpers');
const acuityApiHelpers = require('../helpers/acuityApiHelpers');
const { apiErrorHandler, apiErrorLogger } = require('../utils/index').Error;

const getWebhooks = async (req, res) => {
  try {
    const { data } = await acuityWebhookHelpers.listActiveWebhooks();

    res.json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const createWebhook = async (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) return res.status(400).json({ message: 'Event and target are required' });

  try {
    const { data } = await acuityWebhookHelpers.createNewWebhook(event, target);

    res.status(201).json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const deleteWebhook = async (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const response = await acuityWebhookHelpers.deleteWebhook(id);

    res.json({ message: `A subscription with the id '${id}' deleted` });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointments = async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointments(req.query);

    res.json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointment = async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const { data } = await acuityApiHelpers.listAppointmentById(req.query);

    res.json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getAppointmentTypes = async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointmentTypes(req.query);

    res.json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getCalendars = async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listCalendars();

    res.json(data);
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

const getForms = async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listForms();

    res.json(data);
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