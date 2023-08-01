const axios = require('axios');
const { ACUITY_EVENTS } = require('../../config/events');
const { listActiveWebhooks, createNewWebhook, deleteWebhook } = require('../../thirdParty/acuityWebhookService');
const { tunnelDomain } = require('../../config/config');

exports.resetWebhooks = async () => {
  const webhooks = await listActiveWebhooks();

  // collect incorrect webhooks
  const tunnelUrl = `${tunnelDomain}/notification`;

  const invalidWebhooks = webhooks.filter(({ target }) => target !== tunnelUrl);

  // delete incorrect webhooks
  const deleteWebhooks = await axios.all(
    invalidWebhooks.map(
      async ({ id }) => await deleteWebhook(id)
    )
  );

  const addWebhooks = await axios.all(
    ACUITY_EVENTS.map(
      async (event) => await createNewWebhook(event, tunnelUrl)
    )
  );
};