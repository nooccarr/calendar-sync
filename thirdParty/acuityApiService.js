const axios = require('axios');
const { acuityUri } = require('../config/config');

let listAppointments = async (params, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : acuityUri
    }
  });
  return data;
};

let listAppointmentById = async (params, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `https://acuityscheduling.com/api/v1/appointments/${params.id}`,
    params,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : acuityUri
    }
  });
  return data;
};

let listAppointmentTypes = async (params, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    params,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : acuityUri
    }
  });
  return data;
};

let listCalendars = async (auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/calendars',
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : acuityUri
    }
  });
  return data;
};

let listForms = async (auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/forms',
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : acuityUri
    }
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
