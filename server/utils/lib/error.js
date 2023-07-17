const { logEvents } = require('../../middleware/logger');

exports.apiErrorHandler = (err, req, res) => {
  const data = err.response?.data;

  if (typeof data === 'string') {
    return res.status(err.response.status).json({ Error: err.response.data });
  } else if (typeof data === 'object') {
    return res.status(err.response.status).json({ Error: err.response.data });
  } else if (err.cause) {
    return res.status(502).json({ Error: err.cause });
  } else {
    return res.status(400).json({ Error: err.message });
  }
};

exports.apiErrorLogger = (err, req, res, isWebhook = false) => {
  const data = err.response?.data;

  let message = '';

  if (typeof data === 'string') {
    if (isWebhook) {
      message = `${req.method} ${req.url} ${err.response.data} ${err.config.method.toUpperCase()} ${err.config.url}`;
    } else {
      message = `${req.method} ${req.url} ${err.response.data}`;
    }
  } else if (typeof data === 'object') {
    message = `${req.method} ${req.url} ${JSON.stringify(err.response.data)}`;
  } else if (err.cause) {
    message = `${req.method} ${req.url} ${JSON.stringify(err.cause)}`;
  } else {
    message = `${req.method} ${req.url} ${err.message}`;
  }

  logEvents(message, 'apiErrLog.log');
}