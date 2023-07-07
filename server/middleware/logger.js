const { format } = require('date-fns');
const { v4: uuid } = require('uuid');

const { existsSync } = require('fs');
const { appendFile, mkdir } = require('fs/promises');
const { join } = require('path');

const logEvents = async (message, logName) => {
  const dateTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    if (!existsSync(join(__dirname, '..', 'logs'))) {
      await mkdir(join(__dirname, '..', 'logs'));
    }

    await appendFile(join(__dirname, '..', 'logs', logName), logItem);
  } catch (err) {
    console.log(err);
  }
};

const logger = (req, res, next) => {
  const { method, url, headers, path } = req;
  logEvents(`${method}\t${url}\t${headers.origin}`, 'reqLog.log');
  console.log(`${method} ${path}`);
  next();
};

module.exports = { logEvents, logger };