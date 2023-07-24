const { format, parseISO } = require('date-fns');
const { logEvents } = require('../middleware/logger');
const { APPOINTMENT_TYPES, OPERATORY } = require('../config/events');
const acuityController = require('../controllers/acuityController');
const openDentalController = require('../controllers/openDentalController');
const appointmentController = require('../controllers/appointmentsController');
const { formatDateOfBirth, formatPhoneNumber, base64Hash, toStartOfWeek } = require('../utils/index').Acuity;
const { apiErrorHandler, apiErrorLogger } = require('../utils/index').Error;

const handleWebhook = async (req, res) => {

  if (base64Hash(req.body) !== req.header('X-Acuity-Signature')) {
    return res.status(403).json({ message: 'This message was forged!' });
  }

  const { action, id, appointmentTypeID } = req.body;

  logEvents(`action: ${action}\tid: ${id}\taptTypeId: ${appointmentTypeID}`, 'webhookLog.log');

  try {
    // get an appointment with matching ID
    const appointment = await acuityController.getAppointment({ query: { id, pastFormAnswers: 'false' } });

    let { firstName, lastName, phone, email, datetime, forms } = appointment;

    const birthDate = formatDateOfBirth(forms);

    // event handler goes here
    switch (action) {
      case 'appointment.scheduled': {
        // get a list of patients
        const patients = await openDentalController.getPatients({
          query: {
            LName: lastName,
            FName: firstName,
            Birthdate: birthDate,
            Phone: phone
          }
        });

        const patientCount = patients.length;

        let PatNum;

        // if no patient or many patients found, create a new patient
        if (patientCount !== 1) {
          const newPatient = await openDentalController.createPatient({
            body: {
              LName: lastName,
              FName: firstName,
              Birthdate: birthDate,
              WirelessPhone: phone,
              Email: email
            }
          });

          PatNum = newPatient.PatNum;
        }

        // create a new appointment
        PatNum = PatNum || patients[0].PatNum; // if patientCount === 1

        const AptDateTime = format(parseISO(datetime), 'yyyy-MM-dd HH:mm:ss');

        const AppointmentTypeNum = patientCount <= 1 ?
          APPOINTMENT_TYPES[appointmentTypeID] :
          APPOINTMENT_TYPES['manyEntriesFound'];

        const newAppointment = await openDentalController.createAppointment({
          body: {
            PatNum,
            AptDateTime,
            AppointmentTypeNum,
            Op: OPERATORY['Op1']
          }
        });

        // store id, appointment number, and patient number to the DB
        const { AptNum } = newAppointment;

        const newAppointmentDB = await appointmentController.createAppointment(
          { body: { id, PatNum, AptNum } }
        );

        res.status(201).json(newAppointmentDB);

        break;
      }
      case 'appointment.rescheduled': {
        // query the DB
        const appointmentDB = await appointmentController.getAppointment({ query: { aptId: id } });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update appointment
        const { aptNum } = appointmentDB;

        const AptDateTime = format(parseISO(datetime), 'yyyy-MM-dd HH:mm:ss');

        const response = await openDentalController.updateAppointment({
          query: { AptNum: aptNum },
          body: { AptDateTime }
        });

        res.json({ message: `Updated an appointment with ID ${id}` });

        break;
      }
      case 'appointment.canceled': {
        // query the DB
        const appointmentDB = await appointmentController.getAppointment({ query: { aptId: id } });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update an appointment
        const { aptNum } = appointmentDB;

        const AptDateTime = toStartOfWeek(datetime);

        const updateAppointment = await openDentalController.updateAppointment({
          query: { AptNum: aptNum },
          body: { AptDateTime }
        });

        // break an appointment
        const breakAppointment = await openDentalController.breakAppointment({
          query: { AptNum: aptNum },
          body: { sendToUnscheduledList: false }
        });

        res.json({ message: `Deleted an appointment with ID ${id}` });

        break;
      }
      case 'appointment.changed': {
        // query the DB
        const appointmentDB = await appointmentController.getAppointment({ query: { aptId: id } });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // get appointment
        const { aptNum, patNum } = appointmentDB;

        const appointment = await openDentalController.getAppointment({ query: { AptNum: aptNum } });

        // get patient
        if (appointment) {
          const patient = await openDentalController.getPatient({ query: { PatNum: patNum } });

          // update patient
          const { LName, FName, Birthdate, WirelessPhone, Email } = patient;

          phone = formatPhoneNumber(phone);

          if (LName !== lastName || FName !== firstName || Birthdate !== birthDate || WirelessPhone !== phone || Email !== email) {
            const updatePatient = await openDentalController.updatePatient({
              query: {
                PatNum: patNum
              },
              body: {
                LName: lastName || LName,
                FName: firstName || FName,
                Birthdate: birthDate !== '0001-01-01' ? birthDate : Birthdate,
                WirelessPhone: phone || WirelessPhone,
                Email: email || Email
              }
            });

            res.json({ message: `Updated a patient with ID ${id}` });
          } else {
            res.json({ message: 'Nothing here to change' });
          }
        }

        break;
      }
      default: {
        res.status(400).json({ message: 'Invalid webhook event' });
      }
    }
  } catch (err) {
    apiErrorLogger(err, req, res, true);
    apiErrorHandler(err, req, res);
  }
};

module.exports = { handleWebhook };