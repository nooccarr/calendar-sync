require('dotenv').config();
const axios = require('axios');

let listAppointments = (queryParams) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params: queryParams,
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
  };

  return axios.request(options);
};

let listAppointmentById = (id) => {
  const options = {
    method: 'GET',
    url: `https://acuityscheduling.com/api/v1/appointments/${id}`,
    headers: { Authorization: process.env.ACUITY_URI }
  };

  return axios.request(options);
};

let listAppointmentTypes = (queryParams) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    },
    params: queryParams
  };

  return axios.request(options);
};

let listCalendars = () => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/calendars',
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
  };

  return axios.request(options);
};

let listForms = () => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/forms',
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
  };

  return axios.request(options);
}

module.exports = {
  listAppointments,
  listAppointmentById,
  listAppointmentTypes,
  listCalendars,
  listForms
};
