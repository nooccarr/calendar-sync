const axios = require('axios');
const { acuityUri: Authorization } = require('../config/config');

let listAppointments = async (params) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params,
    headers: { Accept: 'application/json', Authorization }
  });
  return data;
};

let listAppointmentById = async (params) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `https://acuityscheduling.com/api/v1/appointments/${params.id}`,
    params,
    headers: { Accept: 'application/json', Authorization }
  });
  return data;
};

let listAppointmentTypes = async (params) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    params,
    headers: { Accept: 'application/json', Authorization }
  });
  return data;
};

let listCalendars = async () => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/calendars',
    headers: { Accept: 'application/json', Authorization }
  });
  return data;
};

let listForms = async () => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/forms',
    headers: { Accept: 'application/json', Authorization }
  });
  return data;
}

module.exports = {
  listAppointments,
  listAppointmentById,
  listAppointmentTypes,
  listCalendars,
  listForms
};
