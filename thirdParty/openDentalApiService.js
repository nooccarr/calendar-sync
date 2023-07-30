const axios = require('axios');
const { opendentalDomain, opendentalUri } = require('../config/config');

const listPatients = async (params, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `${opendentalDomain}/api/v1/patients`,
    params,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return data;
};

const listPatient = async (PatNum, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `${opendentalDomain}/api/v1/patients/${PatNum}`,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return data;
};

const listAppointments = async (params, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `${opendentalDomain}/api/v1/appointments`,
    params,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return data;
};

const listAppointment = async (AptNum, auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `${opendentalDomain}/api/v1/appointments/${AptNum}`,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return data;
};

const createNewPatient = async (data, auth) => {
  const { data: patient } = await axios.request({
    method: 'POST',
    url: `${opendentalDomain}/api/v1/patients`,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    },
    data
  });
  return patient;
};

const createNewAppointment = async (data, auth) => {
  const { data: appointment } = await axios.request({
    method: 'POST',
    url: `${opendentalDomain}/api/v1/appointments`,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    },
    data
  });
  return appointment;
};

const updatePatient = async (PatNum, data, auth) => {
  const { data: patient } = await axios.request({
    method: 'PUT',
    url: `${opendentalDomain}/api/v1/patients/${PatNum}`,
    data,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return patient;
};

const updateAppointment = async (AptNum, data, auth) => {
  const { data: appointment } = await axios.request({
    method: 'PUT',
    url: `${opendentalDomain}/api/v1/appointments/${AptNum}`,
    data,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return appointment;
};

const breakAppointment = async (AptNum, data, auth) => {
  const { data: appointment } = await axios.request({
    method: 'PUT',
    url: `${opendentalDomain}/api/v1/appointments/${AptNum}/Break`,
    data,
    headers: {
      Accept: 'application/json',
      Authorization: auth ? auth : opendentalUri
    }
  });
  return appointment;
};

module.exports = {
  listPatients,
  listPatient,
  listAppointments,
  listAppointment,
  createNewPatient,
  createNewAppointment,
  updatePatient,
  updateAppointment,
  breakAppointment
};
