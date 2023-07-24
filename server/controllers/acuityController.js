const acuityWebhookHelpers = require('../helpers/acuityWebhookHelpers');
const acuityApiHelpers = require('../helpers/acuityApiHelpers');

const getWebhooks = async (req, res) => {
  const { data } = await acuityWebhookHelpers.listActiveWebhooks();

  return data;
};

const createWebhook = async (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) throw Error('Event and target are required');

  const { data } = await acuityWebhookHelpers.createNewWebhook(event, target);

  return data;
};

const deleteWebhook = async (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) throw Error('ID required');

  await acuityWebhookHelpers.deleteWebhook(id);
};

const getAppointments = async (req, res) => {
  const { data } = await acuityApiHelpers.listAppointments(req.query);

  return data;
};

const getAppointment = async (req, res) => {
  const { id } = req.query;

  if (!id) throw Error('ID required');

  const { data } = await acuityApiHelpers.listAppointmentById(req.query);

  return data;
};

const getAppointmentTypes = async (req, res) => {
  const { data } = await acuityApiHelpers.listAppointmentTypes(req.query);

  return data;

};

const getCalendars = async (req, res) => {
  const { data } = await acuityApiHelpers.listCalendars();

  return data;

};

const getForms = async (req, res) => {
  const { data } = await acuityApiHelpers.listForms();

  return data;

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