const axios = require('axios');
const { opendentalUri: Authorization } = require('../config/config');

const listPatients = async (params) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/patients',
    params,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return data;
};

const listPatient = async (PatNum) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `https://api.opendental.com/api/v1/patients/${PatNum}`,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return data;
};

const listAppointments = async (params) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://api.opendental.com/api/v1/appointments',
    params,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return data;
};

const listAppointment = async (AptNum) => {
  const { data } = await axios.request({
    method: 'GET',
    url: `https://api.opendental.com/api/v1/appointments/${AptNum}`,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return data;
};

const createNewPatient = async (data) => {
  const { data: patient } = await axios.request({
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/patients',
    headers: { Authorization, 'Content-Type': 'application/json' },
    data
  });
  return patient;
};

const createNewAppointment = async (data) => {
  const { data: appointment } = await axios.request({
    method: 'POST',
    url: 'https://api.opendental.com/api/v1/appointments',
    headers: { Authorization, 'Content-Type': 'application/json' },
    data
  });
  return appointment;
};

const updateAppointment = async (AptNum, data) => {
  const { data: appointment } = await axios.request({
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${AptNum}`,
    data,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return appointment;
};

const breakAppointment = async (AptNum, data) => {
  const { data: appointment } = await axios.request({
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/appointments/${AptNum}/Break`,
    data,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return appointment;
};

const updatePatient = async (PatNum, data) => {
  const { data: patient } = await axios.request({
    method: 'PUT',
    url: `https://api.opendental.com/api/v1/patients/${PatNum}`,
    data,
    headers: { Authorization, 'Content-Type': 'application/json' }
  });
  return patient;
};

module.exports = {
  listPatients,
  listPatient,
  listAppointments,
  listAppointment,
  createNewPatient,
  createNewAppointment,
  updateAppointment,
  breakAppointment,
  updatePatient
};
