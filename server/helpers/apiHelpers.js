require('dotenv').config();

let listAllAppointments = (callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    params: { max: '2', canceled: 'false', excludeForms: 'false', direction: 'DESC' },
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

// FIXME:
let createNewAppointment = (callback) => {
  const options = {
    method: 'POST',
    url: 'https://acuityscheduling.com/api/v1/appointments',
    headers: {
      // accept: 'application/json',
      // 'content-type': 'application/json',
      authorization: process.env.AUTHORIZATION
    },
    data: {
      appointmentTypeID: 1,
      datetime: '2023-08-01T10:00',
      firstName: 'Test',
      lastName: 'Ing',
      email: 'd2axasap@gmail.com'
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

module.exports = {
  listAllAppointments,
  createNewAppointment
};
