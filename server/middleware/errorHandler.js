const { logEvents } = require('./logger');

const errorHandler = (err, req, res, next) => {
  const { name, message, method, url, headers } = req;
  logEvents(`${name}: ${message}\t${method}\t${url}\t${headers.origin}`, 'errLog.log');
  console.error(err.stack);

  const status = res.statusCode || 500;

  res.status(status).json({ message });
};

module.exports = errorHandler;