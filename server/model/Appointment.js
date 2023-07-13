const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema(
  {
    aptId: {
      type: Number,
      required: true,
      unique: true
    },
    patNum: {
      type: Number,
      required: true
    },
    aptNum: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
