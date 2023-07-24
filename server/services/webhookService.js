require('dotenv').config();
const localtunnel = require('localtunnel');
const axios = require('axios');
const { ACUITY_EVENTS } = require('../config/events');
const { createWebhook, deleteWebhook, getWebhooks } = require('../controllers/acuityController');
const { apiErrorLogger } = require('../utils/index').Error;
const PORT = process.env.PORT || 3000;

const resetWebhooks = async () => {
  const tunnel = await localtunnel({ port: PORT });

  const webhooks = await getWebhooks()
    .catch(err => apiErrorLogger(err));

  const ids = webhooks.map(({ id }) => id);

  const deleteWebhooks = await axios.all(
    ids.map(
      async (id) => {
        await deleteWebhook({ query: { id } })
          .catch(err => apiErrorLogger(err));
      }
    )
  );

  const addWebhooks = await axios.all(
    ACUITY_EVENTS.map(
      async (event) => {
        await createWebhook({ body: { event, target: tunnel.url } })
          .catch(err => apiErrorLogger(err));
      })
  );

  tunnel.on('close', () => { console.log('Stopped listening to webhook events') });

  console.log(`Server running on port ${PORT}`);
};

module.exports = { resetWebhooks };