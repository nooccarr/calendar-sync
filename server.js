const app = require('./express');
const mongoose = require('mongoose');
const { logEvents } = require('./middleware/logger');
const connectDB = require('./config/dbConn');
const { resetWebhooks } = require('./helpers/index').Webhook;
const { apiErrorLogger } = require('./helpers/index').Error;
const { port } = require('./config/config');

connectDB();

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');

  app.listen(port, async () => {
    try {
      await resetWebhooks();
    } catch (err) {
      apiErrorLogger(err);
    }
    console.log(`Server running on port ${port}`);
  });
});

mongoose.connection.on('error', err => {
  logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
  console.error(err.stack);
});
