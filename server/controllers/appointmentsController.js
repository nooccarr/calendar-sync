const Appointment = require('../model/Appointment');

const getAppointments = async (req, res) => {
  const appointments = await Appointment.find();
  if (appointments?.length === 0) return res.status(204).json({ message: 'No appointments found' });
  res.json(appointments);
};

const createAppointment = async (req, res) => {
  const { id, PatNum, AptNum } = req.body;

  if (!id || !PatNum || !AptNum) {
    return res.status(400).json({ message: 'Id, patient number, and appointment number required' });
  }

  try {
    const result = await Appointment.create({
      aptId: id,
      patNum: PatNum,
      aptNum: AptNum
    });

    res.status(201).json(result);
  } catch (err) {
    res.json({ Error: err.message });
  }
};

const deleteAppointment = async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: 'Appointment ID required' });

  try {
    const appointment = await Appointment.findOne({ aptId: id }).exec();

    if (!appointment) return res.status(400).json({ message: `No appointment matches ID ${id}` });

    const result = await Appointment.deleteOne({ aptId: id });

    res.json(result);
  } catch (err) {
    res.json({ Error: err.message });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
  deleteAppointment
};