require('dotenv').config();
const axios = require('axios');

let listAppointments = (params) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params,
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
  };

  return axios.request(options);
};

let listAppointmentById = (params) => {
  const options = {
    method: 'GET',
    url: `https://acuityscheduling.com/api/v1/appointments/${params.id}`,
    params,
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
  };

  return axios.request(options);
};

let listAppointmentTypes = (params) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    params,
    headers: {
      Accept: 'application/json',
      Authorization: process.env.ACUITY_URI
    }
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
