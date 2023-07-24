const Appointment = require('../model/Appointment');

const getAppointments = async (req, res) => {
  const appointments = await Appointment.find();

  return appointments;
};

const getAppointment = async (req, res) => {
  const { aptId } = req.query;

  if (!aptId) throw Error('ID required');

  const appointment = await Appointment.findOne({ aptId });

  return appointment;
};

const createAppointment = async (req, res) => {
  const { id, PatNum, AptNum } = req.body;

  if (!id || !PatNum || !AptNum) {
    throw Error('ID, patient number, and appointment number required');
  }

  const result = await Appointment.create({
    aptId: id,
    patNum: PatNum,
    aptNum: AptNum
  });

  return result;
};

const deleteAppointment = async (req, res) => {
  const { id } = req.body;

  if (!id) throw Error('Appointment ID required');

  const appointment = await Appointment.findOne({ aptId: id }).exec();

  if (!appointment) throw Error(`No appointment matches ID ${id}`);

  const result = await Appointment.deleteOne({ aptId: id });

  return result;
};

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  deleteAppointment
};