require('dotenv').config();
const axios = require('axios');

let listActiveWebhooks = () => {
  const options = {
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization: process.env.ACUITY_URI }
  };

  return axios.request(options);
};

let createNewWebhook = (event, target) => {
  const options = {
    method: 'POST',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization: process.env.ACUITY_URI },
    data: { event, target }
  };

  return axios.request(options);
};

let deleteWebhook = (id) => {
  const options = {
    method: 'DELETE',
    url: `https://acuityscheduling.com/api/v1/webhooks/${id}`,
    headers: { Authorization: process.env.ACUITY_URI }
  };

  return axios.request(options);
};

module.exports = {
  listActiveWebhooks,
  createNewWebhook,
  deleteWebhook
};
