const axios = require('axios');
const { acuityUri } = require('../config/config');

let listActiveWebhooks = async (auth) => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization: auth ? auth : acuityUri }
  });
  return data;
};

let createNewWebhook = async (event, target, auth) => {
  const { data } = await axios.request({
    method: 'POST',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization: auth ? auth : acuityUri },
    data: { event, target }
  });
  return data;
};

let deleteWebhook = async (id, auth) => {
  const { data } = await axios.request({
    method: 'DELETE',
    url: `https://acuityscheduling.com/api/v1/webhooks/${id}`,
    headers: { Authorization: auth ? auth : acuityUri }
  });
  return data;
};

module.exports = {
  listActiveWebhooks,
  createNewWebhook,
  deleteWebhook
};
