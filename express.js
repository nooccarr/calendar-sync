const compression = require('compression');
const express = require('express');
const path = require('path');
const cors = require('cors');
// const corsOptions = require('./config/corsOptions');
const helmet = require('helmet');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const rootRoute = require('./routes/root');
const notificationRoute = require('./routes/notification');
const populateRoute = require('./routes/populate');
const acuityRoute = require('./routes/acuity');
const openDentalRoute = require('./routes/opendental');

const app = express();

app.use(compression());
app.use(logger);
// parse body params and attach them to req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// secure apps by setting various HTTP headers
app.use(helmet());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());

app.use('/', express.static(path.join(__dirname, 'public')));

// mount routes
app.use('/', rootRoute);
app.use('/notification', notificationRoute);
app.use('/populate', populateRoute);
app.use('/acuity', acuityRoute);
app.use('/opendental', openDentalRoute);

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

module.exports = app;