const axios = require('axios');
const localtunnel = require('localtunnel');
const { ACUITY_EVENTS } = require('../../config/events');
const { listActiveWebhooks, createNewWebhook, deleteWebhook } = require('../../thirdParty/acuityWebhookService');
const { port } = require('../../config/config');

exports.resetWebhooks = async () => {
  const tunnel = await localtunnel({ port });

  const webhooks = await listActiveWebhooks();

  const ids = webhooks.map(({ id }) => id);

  const deleteWebhooks = await axios.all(
    ids.map(
      async (id) => (
        await deleteWebhook(id)
      )
    )
  );

  const addWebhooks = await axios.all(
    ACUITY_EVENTS.map(
      async (event) => (
        await createNewWebhook(event, target)
      )
    )
  );

  tunnel.on('close', () => { console.log('Stopped listening to webhook events') });
};