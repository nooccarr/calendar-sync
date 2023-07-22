const axios = require('axios');
const { format, parseISO } = require('date-fns');
const { logEvents } = require('../middleware/logger');
const acuityApiHelpers = require('../helpers/acuityApiHelpers');
const openDentalApiHelpers = require('../helpers/openDentalApiHelpers');
const Appointment = require('../model/Appointment');
const { formatDateOfBirth } = require('../utils/index').Acuity;
const { apiErrorHandler, apiErrorLogger } = require('../utils/index').Error;

const populateDatabase = async (req, res) => {
  try {
    // get all appointments (Acuity Scheduling)
    const appointments = await acuityApiHelpers.listAppointments({ max: 1000 });

    const syncAppointments = await axios.all(
      appointments?.data.map(
        async ({ id, lastName, firstName, phone, datetime, forms }) => {

          // get all patients (Open Dental)
          const birthDate = formatDateOfBirth(forms);

          const patients = await openDentalApiHelpers.listPatients({
            LName: lastName,
            FName: firstName,
            Birthdate: birthDate,
            Phone: phone
          }).catch(err => apiErrorLogger(err, req, res));

          const patientCount = patients?.data?.length;

          if (patientCount === 0) {
            return {
              status: 'NO PATIENT FOUND',
              appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
            };
          }

          if (patientCount > 1) {
            const result = patients.data.map(({ PatNum, LName, FName, WirelessPhone, Birthdate }) => (
              `${PatNum} ${Birthdate} ${WirelessPhone} ${LName} ${FName}`
            ));

            return {
              status: 'MANY PATIENTS FOUND:',
              appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`,
              patients: result
            }
          }

          if (patientCount === 1) {
            const { PatNum } = patients.data[0];

            const date = format(parseISO(datetime), 'yyyy-MM-dd');

            // get all appointments (Open Dental)
            const appointments = await openDentalApiHelpers.listAppointments(
              { PatNum, date }
            ).catch(err => apiErrorHandler(err, req, res));;

            const appointmentCount = appointments?.data?.length;

            if (appointmentCount === 0) {
              return {
                status: 'NO APPOINTMENT FOUND',
                appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
              };
            }

            if (appointmentCount > 1) {
              return {
                status: 'MANY APPOINTMENTS FOUND',
                appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
              };
            }

            if (appointmentCount === 1) {
              // store appointment in the database
              const { AptNum } = appointments.data[0];

              const newAppointmentDB = await Appointment.create({
                aptId: id,
                patNum: PatNum,
                aptNum: AptNum
              }).catch(err => logEvents(err.stack.split('\n')[0], 'mongoErrLog.log'));

              return {
                status: 'MATCHING',
                appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
              };
            }
          }
        }));

    const hasUndefined = syncAppointments.some(appointment => appointment === undefined);

    if (hasUndefined) return res.json({ message: 'Failed to populate database with appointments' });

    const notMatching = syncAppointments.filter(({ status }) => status !== 'MATCHING');

    if (notMatching.length !== 0) return res.json(notMatching);

    res.json({ message: 'Appointments are populated in the database' });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

module.exports = {
  populateDatabase
};