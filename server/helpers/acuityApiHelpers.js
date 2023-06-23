require('dotenv').config();
const axios = require('axios');

let listAppointments = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params: queryParams,
    headers: {
      accept: 'application/json',
      authorization: process.env.ACUITY_AUTH
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

let listAppointmentById = (id, callback) => {
  const options = {
    method: 'GET',
    url: `https://acuityscheduling.com/api/v1/appointments/${id}`,
    headers: { authorization: process.env.ACUITY_AUTH }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

let listAppointmentTypes = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    headers: {
      accept: 'application/json',
      authorization: process.env.ACUITY_AUTH
    },
    params: queryParams
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

let listCalendars = (callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/calendars',
    headers: {
      accept: 'application/json',
      authorization: process.env.ACUITY_AUTH
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

let listForms = (callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/forms',
    headers: {
      accept: 'application/json',
      authorization: process.env.ACUITY_AUTH
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
}

module.exports = {
  listAppointments,
  listAppointmentById,
  listAppointmentTypes,
  listCalendars,
  listForms
};
