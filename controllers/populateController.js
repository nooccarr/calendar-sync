const axios = require('axios');
const { format, parseISO } = require('date-fns');
const acuityApiService = require('../thirdParty/acuityApiService');
const openDentalApiService = require('../thirdParty/openDentalApiService');
const Appointment = require('../model/Appointment');
const { formatDateOfBirth } = require('../helpers/index').Acuity;
const { apiErrorHandler, apiErrorLogger } = require('../helpers/index').Error;

const populateDatabase = async (req, res) => {
  try {
    // get all appointments (Acuity Scheduling)
    const appointments = await acuityApiService.listAppointments({ max: 10000 });

    const syncAppointments = await axios.all(
      appointments.map(
        async ({ id, lastName, firstName, phone, datetime, forms }) => {

          // get all patients (Open Dental)
          const birthDate = formatDateOfBirth(forms);

          const patients = await openDentalApiService.listPatients({
            LName: lastName,
            FName: firstName,
            Birthdate: birthDate,
            Phone: phone
          });

          const patientCount = patients.length;

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
            const { PatNum } = patients[0];

            const date = format(parseISO(datetime), 'yyyy-MM-dd');

            // get all appointments (Open Dental)
            const appointments = await openDentalApiService.listAppointments({ PatNum, date });

            const appointmentCount = appointments.length;

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
              const { AptNum } = appointments[0];

              const newAppointmentDB = await Appointment.create({
                aptId: id,
                patNum: PatNum,
                aptNum: AptNum
              });

              return {
                status: 'MATCHING',
                appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
              };
            }
          }
        }));

    const hasUndefined = syncAppointments.some(appointment => appointment === undefined);

    if (hasUndefined)
      return res.json({ message: 'Failed to populate database with appointments' });

    const notMatching = syncAppointments.filter(({ status }) => status !== 'MATCHING');

    if (notMatching.length > 0)
      return res.json(notMatching);

    res.json({ message: 'Appointments are populated in the database' });
  } catch (err) {
    apiErrorLogger(err, req, res);
    apiErrorHandler(err, req, res);
  }
};

module.exports = { populateDatabase };