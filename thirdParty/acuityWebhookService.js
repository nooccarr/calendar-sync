const axios = require('axios');
const { acuityUri: Authorization } = require('../config/config');

let listActiveWebhooks = async () => {
  const { data } = await axios.request({
    method: 'GET',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization }
  });
  return data;
};

let createNewWebhook = async (event, target) => {
  const { data } = await axios.request({
    method: 'POST',
    url: 'https://acuityscheduling.com/api/v1/webhooks',
    headers: { Authorization },
    data: { event, target }
  });
  return data;
};

let deleteWebhook = async (id) => {
  const { data } = await axios.request({
    method: 'DELETE',
    url: `https://acuityscheduling.com/api/v1/webhooks/${id}`,
    headers: { Authorization }
  });
  return data;
};

module.exports = {
  listActiveWebhooks,
  createNewWebhook,
  deleteWebhook
};
