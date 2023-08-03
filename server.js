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

  const server = app.listen(port, async () => {
    try {
      await resetWebhooks();
    } catch (err) {
      apiErrorLogger(err);
    }
    console.log(`Server running on port ${port}`);
    process.send('ready');
  });

  process.on('message', (msg) => {
    if (msg == 'shutdown') {
      console.log('Closing all connections...');

      server.close((err) => {
        if (err) {
          console.error(err);
          process.exit(1);
        }

        mongoose.connection.close();

        mongoose.connection.on('close', () => {
          console.log('Mongoose connection disconnected');
          process.exit(0);
        });
      });

      setTimeout(() => {
        console.log('Finished closing connections');
        process.exit(0);
      }, 1500);
    }
  });
});

mongoose.connection.on('error', (err) => {
  logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
  console.error(err.stack);
});
