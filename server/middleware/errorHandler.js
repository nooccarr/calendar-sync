const { logEvents } = require('./logger');

const errorHandler = (err, req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}\t${err.stack.split('\n')[0]}`, 'mongoErrLog.log');
  // logEvents(`${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log');

  console.error(err.stack);

  const status = res.statusCode || 500;

  res.status(status).json({ message: err.message });
};

module.exports = errorHandler;