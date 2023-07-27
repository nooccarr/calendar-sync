const { logEvents } = require('./logger');

const errorHandler = (err, req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${err.stack.split('\n')[0]}\t${req.headers.origin}`, 'errLog.log');

  console.error(err.stack);

  const status = res.statusCode || 500;

  res.status(status).json({ Error: err.message });
};

module.exports = errorHandler;