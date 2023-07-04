require('dotenv').config();
const axios = require('axios');

const listPatient = (PatNum) => {
  const options = {
    method: 'GET',
    url: `https://api.opendental.com/api/v1/patients/${PatNum}`,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
};

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

const updateAppointment = (id, data) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${id}`,
    data,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
};

const breakAppointment = (id, data) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${id}/Break`,
    data,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
};

const updatePatient = (id, data) => {
  const options = {
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/patients/${id}`,
    data,
    headers: {
      Authorization: process.env.OPENDENTAL_URI,
      'Content-Type': 'application/json'
    }
  };

  return axios.request(options);
}

module.exports = {
  listPatient,
  listPatients,
  listAppointments,
  createNewPatient,
  createNewAppointment,
  updateAppointment,
  breakAppointment,
  updatePatient
};
