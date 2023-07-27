const mongoose = require('mongoose');
const { mongoUri } = require('../config/config');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;