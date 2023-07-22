require('dotenv').config();
const compression = require('compression');
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const { logEvents, logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const { resetWebhooks } = require('./services/webhookService');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3000;

connectDB();

app.use(compression());
app.use(logger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/root'));
app.use('/notification', require('./routes/api/notification'));
app.use('/populate', require('./routes/api/populate'));
app.use('/acuity', require('./routes/api/acuity'));
app.use('/opendental', require('./routes/api/opendental'));
app.use('/appointments', require('./routes/api/appointments'));

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ Error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, resetWebhooks);
});

mongoose.connection.on('error', err => {
  logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
  console.error(err.stack);
});
