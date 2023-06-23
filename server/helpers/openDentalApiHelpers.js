require('dotenv').config();
const axios = require('axios');

const listPatients = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/patients',
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    params: queryParams
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

const listAppointments = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/appointments',
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    params: queryParams
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
}

const createNewPatient = (body, callback) => {
  const options = {
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/patients',
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    body
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

const createNewAppointment = (body, callback) => {
  const options = {
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/appointments',
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    body
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

const updateAppointment = (id, body, callback) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${id}`,
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    body
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

const breakAppointment = (id, body, callback) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${id}/break`,
    headers: { authorization: process.env.OPENDENTAL_AUTH },
    body
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

module.exports = {
  listPatients,
  listAppointments,
  createNewPatient,
  createNewAppointment,
  updateAppointment,
  breakAppointment
};
