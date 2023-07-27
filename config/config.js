const dotenv = require('dotenv');

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  acuityUri: process.env.ACUITY_URI,
  opendentalUri: process.env.OPENDENTAL_URI,
  mongoUri: process.env.MONGODB_URI,
  acuityApiKey: process.env.ACUITY_API_KEY
};

module.exports = config;