require('dotenv').config();
const axios = require('axios');

let listAllActiveWebhooks = (callback) => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
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

let createNewWebhook = (callback) => {
  const options = {
    method: 'POST',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: {
      // accept: 'application/json',
      // 'content-type': 'application/json',
      authorization: process.env.AUTHORIZATION
    },
    data: {
      event: 'appointment.rescheduled',
      target: 'http://localhost:3000/notification'
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

let deleteWebhook = (callback) => {
  const options = {
    method: 'DELETE',
    url: 'https://acuityscheduling.com/api/v1/webhooks/750770',
    headers: {
      authorization: process.env.AUTHORIZATION
    }
  };

  axios
    .request(options)
    .then(response => callback(null, response))
    .catch(error => callback(error));
};

module.exports = {
  listAllActiveWebhooks,
  createNewWebhook,
  deleteWebhook
};
