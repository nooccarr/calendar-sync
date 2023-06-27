require('dotenv').config();
const axios = require('axios');

const listPatients = (params) => {
  const options = {
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/patients',
    params,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
};

const listAppointments = (params) => {
  const options = {
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/appointments',
    params,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
};

const createNewPatient = (data) => {
  const options = {
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/patients',
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    },
    data
  };

  return axios.request(options);
};

const createNewAppointment = (data) => {
  const options = {
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/appointments',
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    },
    data
  };

  return axios.request(options);
};

const updateAppointment = (id, body, callback) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${id}`,
    headers: { Authorization: process.env.OPENDENTAL_URI },
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
    headers: { Authorization: process.env.OPENDENTAL_URI },
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
