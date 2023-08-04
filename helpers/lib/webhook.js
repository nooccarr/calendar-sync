const axios = require('axios');
const { ACUITY_EVENTS } = require('../../config/events');
const { listActiveWebhooks, createNewWebhook, deleteWebhook } = require('../../thirdParty/acuityWebhookService');
const { tunnelDomain } = require('../../config/config');

exports.resetWebhooks = async () => {
  const tunnelUrl = `${tunnelDomain}/notification`;
  
  const webhooks = await listActiveWebhooks();

  const invalidWebhooks = webhooks.filter(({ target }) => target !== tunnelUrl);

  const deleteWebhooks = await axios.all(
    invalidWebhooks.map(
      async ({ id }) => await deleteWebhook(id)
    )
  );

  const validWebhooks = webhooks.filter(({ target }) => target === tunnelUrl);

  if (validWebhooks.length !== ACUITY_EVENTS.length) {
    const addWebhooks = await axios.all(
      ACUITY_EVENTS.map(
        async (event) => await createNewWebhook(event, tunnelUrl)
      )
    );
  }
};