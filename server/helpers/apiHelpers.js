require('dotenv').config();
const axios = require('axios');

let listAppointments = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params: queryParams,
    headers: {
      accept: 'application/json',
      authorization: process.env.AUTHORIZATION
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
    headers: { authorization: process.env.AUTHORIZATION }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

// let createNewAppointment = (callback) => {
//   const options = {
//     method: 'POST',
//     url: 'https://acuityscheduling.com/api/v1/appointments',
//     headers: {
//       // accept: 'application/json',
//       // 'content-type': 'application/json',
//       authorization: process.env.AUTHORIZATION
//     },
//     data: {
//       appointmentTypeID: 1,
//       datetime: '2023-08-01T10:00',
//       firstName: 'Test',
//       lastName: 'Ing',
//       email: 'd2axasap@gmail.com'
//     }
//   };

//   axios
//     .request(options)
//     .then(response => callback(null, response))
//     .catch(error => callback(error));
// };

let listAppointmentTypes = (queryParams, callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointment-types',
    headers: {
      accept: 'application/json',
      authorization: process.env.AUTHORIZATION
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
      authorization: process.env.AUTHORIZATION
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
      authorization: process.env.AUTHORIZATION
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
  // createNewAppointment,
  listAppointmentTypes,
  listCalendars,
  listForms
};
