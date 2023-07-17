const { logEvents } = require('../../middleware/logger');

exports.apiErrorHandler = (err, req, res) => {
  const data = err.response?.data;

  if (typeof data === 'string') {
    logEvents(`${req.method} ${req.url} ${err.response.data}`, 'apiErrLog.log');
    return res.status(err.response.status).json({ Error: err.response.data });
  }

  if (typeof data === 'object') {
    logEvents(`${req.method} ${req.url} ${JSON.stringify(err.response.data)}`, 'apiErrLog.log');
    return res.status(err.response.status).json({ Error: err.response.data });
  }

  if (err.cause) {
    logEvents(`${req.method} ${req.url} ${JSON.stringify(err.cause)}`, 'apiErrLog.log');
    return res.status(502).json({ Error: err.cause });
  }

  logEvents(`${req.method} ${req.url} ${err.message}`, 'apiErrLog.log');
  return res.status(400).json({ Error: err.message });
};

// exports.openDentalErrorHandler = (err, req, res) => {
//   logEvents(
//     `${req.method}\t${req.url}\t${err.response.status}:\t${err.response.data.message}\t${req.headers.origin}`,
//     'openDentalErrLog.log'
//   );
// };