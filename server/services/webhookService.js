require('dotenv').config();
const localtunnel = require('localtunnel');
const axios = require('axios');
const { ACUITY_EVENTS } = require('../config/events');
const acuityWebhookHelpers = require('../helpers/acuityWebhookHelpers');
const { apiErrorLogger } = require('../utils/index').Error;
const PORT = process.env.PORT || 3000;

const resetWebhooks = async () => {
  const tunnel = await localtunnel({ port: PORT });

  try {
    // reset webhook subscriptions
    const webhooks = await acuityWebhookHelpers.listActiveWebhooks();

    const ids = webhooks.data.map(({ id }) => id);

    const deleteWebhooks = await axios.all(
      ids.map(
        async (id) => await acuityWebhookHelpers.deleteWebhook(id)
      )
    );

    const addWebhooks = await axios.all(
      ACUITY_EVENTS.map(
        async (event) => await acuityWebhookHelpers.createNewWebhook(event, `${tunnel.url}/notification`)
      )
    );

  } catch (err) {
    apiErrorLogger(err);
  }

  tunnel.on('close', () => { console.log('Stopped listening to webhook events') });

  console.log(`Server running on port ${PORT}`);
};

module.exports = {
  resetWebhooks
};