require('dotenv').config();
const express = require('express');
const app = express();
// const crypto = require('crypto');
const compression = require('compression');
const localtunnel = require('localtunnel');
const path = require('path');
const { logEvents, logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const axios = require('axios');
const { format, parseISO } = require('date-fns');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3000;

// config
const { ACUITY_EVENTS, APPOINTMENT_TYPES, OPERATORY } = require('./config/events');

// utility helpers
const { formatDateOfBirth, formatPhoneNumber, toStartOfWeek } = require('./utils/index').Acuity;
const { apiErrorHandler, apiErrorLogger } = require('./utils/index').Error;

// connect to MongoDB
connectDB();

// middleware
app.use(compression());

// middleware: custom
app.use(logger);

// middleware: built-in
app.use(express.json()); // application/json
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// serve static files
app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/root'));
app.use('/acuity', require('./routes/api/acuity'));
app.use('/opendental', require('./routes/api/opendental'));
app.use('/appointments', require('./routes/api/appointments'));

// // route: webhook event
app.post('/notification', async (req, res) => {

  // FIXME: verify webhook request
  // // Get hash of message using shared secret:
  // const hash = crypto.createHmac('sha256', process.env.ACUITY_API_KEY)
  //   .update()
  //   .digest('base64');

  // // Compare hash to Acuity signature:
  // if (hash !== req.header('X-Acuity-Signature')) {
  //   console.log('This message was forged');
  //   return res.status(403).json({ message: 'This message was forged!' });
  // } else {
  //   console.log('Matching');
  //   return res.json({ message: 'Matching' });
  // }


  const { action, id, appointmentTypeID } = req.body;

  logEvents(`action: ${action}\tid: ${id}\taptTypeId: ${appointmentTypeID}`, 'webhookLog.log');

  try {
    // get an appointment with matching ID
    const appointment = await acuityApiHelpers.listAppointmentById({ id, pastFormAnswers: 'false' });

    let { firstName, lastName, phone, email, datetime, forms } = appointment.data;

    const birthDate = formatDateOfBirth(forms);

    // event handler goes here
    switch (action) {
      case 'appointment.scheduled': {
        // get a list of patients
        const patients = await openDentalApiHelpers.listPatients({
          LName: lastName,
          FName: firstName,
          Birthdate: birthDate,
          Phone: phone
        });

        const patientCount = patients.data.length;

        let PatNum;

        // if no patient or many patients found, create a new patient
        if (patientCount !== 1) {
          const newPatient = await openDentalApiHelpers.createNewPatient({
            LName: lastName,
            FName: firstName,
            Birthdate: birthDate,
            WirelessPhone: phone,
            Email: email
          });

          PatNum = newPatient.data.PatNum;
        }

        // create a new appointment
        PatNum = PatNum || patients.data[0].PatNum; // if patientCount === 1

        const AptDateTime = format(parseISO(datetime), 'yyyy-MM-dd HH:mm:ss');

        const AppointmentTypeNum = patientCount <= 1 ?
          APPOINTMENT_TYPES[appointmentTypeID] :
          APPOINTMENT_TYPES['manyEntriesFound'];

        const newAppointment = await openDentalApiHelpers.createNewAppointment({
          PatNum,
          AptDateTime,
          AppointmentTypeNum,
          Op: OPERATORY['Op1']
        });

        // store id, appointment number, and patient number to the DB
        const { AptNum } = newAppointment.data;

        const newAppointmentDB = await Appointment.create({
          aptId: id,
          patNum: PatNum,
          aptNum: AptNum
        });

        res.status(201).json(newAppointmentDB);

        break;
      }
      case 'appointment.rescheduled': {
        // query the DB
        const appointmentDB = await Appointment.findOne({ aptId: id });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update appointment
        const { aptNum } = appointmentDB;

        const AptDateTime = format(parseISO(datetime), 'yyyy-MM-dd HH:mm:ss');

        const response = await openDentalApiHelpers.updateAppointment(aptNum, { AptDateTime });

        res.json({ message: `Updated an appointment with ID ${id}` });

        break;
      }
      case 'appointment.canceled': {
        // query the DB
        const appointmentDB = await Appointment.findOne({ aptId: id });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update an appointment
        const { aptNum } = appointmentDB;

        const AptDateTime = toStartOfWeek(datetime);

        const updateAppointment = await openDentalApiHelpers.updateAppointment(aptNum, { AptDateTime });

        // break an appointment
        const breakAppointment = await openDentalApiHelpers.breakAppointment(aptNum, { sendToUnscheduledList: false });

        res.json({ message: `Deleted an appointment with ID ${id}` });

        break;
      }
      case 'appointment.changed': {
        // query the DB
        const appointmentDB = await Appointment.findOne({ aptId: id });

        if (!appointmentDB) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // get appointment
        const { aptNum, patNum } = appointmentDB;

        const appointment = await openDentalApiHelpers.listAppointment(aptNum);

        // get patient
        if (appointment) {
          const patient = await openDentalApiHelpers.listPatient(patNum);

          // update patient
          const { LName, FName, Birthdate, WirelessPhone, Email } = patient.data;

          phone = formatPhoneNumber(phone);

          if (LName !== lastName || FName !== firstName || Birthdate !== birthDate || WirelessPhone !== phone || Email !== email) {
            const updatePatient = await openDentalApiHelpers.updatePatient(patNum, {
              LName: lastName || LName,
              FName: firstName || FName,
              Birthdate: birthDate !== '0001-01-01' ? birthDate : Birthdate,
              WirelessPhone: phone || WirelessPhone,
              Email: email || Email
            });
            res.json({ message: `Updated a patient with ID ${id}` });
          } else {
            res.json({ message: 'Nothing here to change' });
          }
        }

        break;
      }
      default: {
        res.json({ message: 'Invalid webhook event' });
      }
    }
  } catch (err) {
    apiErrorLogger(err, req, res, true);
    apiErrorHandler(err, req, res);
  }
});

// // route: populate database
// app.post('/populate', async (req, res) => {

//   try {
//     // get all appointments (Acuity Scheduling)
//     const appointments = await acuityApiHelpers.listAppointments({ max: 1000 });

//     const syncAppointments = await axios.all(
//       appointments?.data.map(
//         async ({ id, lastName, firstName, phone, datetime, forms }) => {

//           // get all patients (Open Dental)
//           const birthDate = formatDateOfBirth(forms);

//           const patients = await openDentalApiHelpers.listPatients({
//             LName: lastName,
//             FName: firstName,
//             Birthdate: birthDate,
//             Phone: phone
//           }).catch(err => apiErrorLogger(err, req, res));

//           const patientCount = patients?.data?.length;

//           if (patientCount === 0) {
//             return {
//               status: 'NO PATIENT FOUND',
//               appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
//             };
//           }

//           if (patientCount > 1) {
//             const result = patients.data.map(({ PatNum, LName, FName, WirelessPhone, Birthdate }) => (
//               `${PatNum} ${Birthdate} ${WirelessPhone} ${LName} ${FName}`
//             ));

//             return {
//               status: 'MANY PATIENTS FOUND:',
//               appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`,
//               patients: result
//             }
//           }

//           if (patientCount === 1) {
//             const { PatNum } = patients.data[0];

//             const date = format(parseISO(datetime), 'yyyy-MM-dd');

//             // get all appointments (Open Dental)
//             const appointments = await openDentalApiHelpers.listAppointments(
//               { PatNum, date }
//             ).catch(err => apiErrorHandler(err, req, res));;

//             const appointmentCount = appointments?.data?.length;

//             if (appointmentCount === 0) {
//               return {
//                 status: 'NO APPOINTMENT FOUND',
//                 appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
//               };
//             }

//             if (appointmentCount > 1) {
//               return {
//                 status: 'MANY APPOINTMENTS FOUND',
//                 appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
//               };
//             }

//             if (appointmentCount === 1) {
//               // // store appointment in the database TODO:
//               // const { AptNum } = appointments.data[0];

//               // const newAppointmentDB = await Appointment.create({
//               //   aptId: id,
//               //   patNum: PatNum,
//               //   aptNum: AptNum
//               // }).catch(err => logEvents(err.stack.split('\n')[0], 'mongoErrLog.log'));

//               return {
//                 status: 'MATCHING',
//                 appointment: `${id} ${birthDate} ${phone} ${lastName} ${firstName}`
//               };
//             }
//           }
//         }));

//     const hasUndefined = syncAppointments.some(appointment => appointment === undefined);

//     if (hasUndefined) return res.json({ message: 'Failed to populate database with appointments' });

//     const notMatching = syncAppointments.filter(({ status }) => status !== 'MATCHING');

//     if (notMatching.length !== 0) return res.json(notMatching);

//     res.json({ message: 'Appointments are populated in the database' });
//   } catch (err) {
//     apiErrorLogger(err, req, res);
//     apiErrorHandler(err, req, res);
//   }
// });

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ Error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// middleware: custom
app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');

  app.listen(PORT, async () => {
    // const tunnel = await localtunnel({ port: PORT }); // TODO: make it into a file

    // try {
    //   // reset webhook subscriptions
    //   const webhooks = await acuityWebhookHelpers.listActiveWebhooks();

    //   const ids = webhooks.data.map(({ id }) => id);

    //   const deleteWebhooks = await axios.all(
    //     ids.map(
    //       async (id) => await acuityWebhookHelpers.deleteWebhook(id)
    //     )
    //   );

    //   const addWebhooks = await axios.all(
    //     ACUITY_EVENTS.map(
    //       async (event) => await acuityWebhookHelpers.createNewWebhook(event, `${tunnel.url}/notification`)
    //     )
    //   );

    //   // const subscribed = addWebhooks.map(({ data }) => data);
    //   // console.log(subscribed);
    // } catch (err) {
    //   apiErrorLogger(err);
    // }

    // tunnel.on('close', () => { console.log('Stopped listening to webhook events') });

    console.log(`Server running on port ${PORT}`);
  });
});

mongoose.connection.on('error', err => {
  logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
  console.error(err.stack);
});
