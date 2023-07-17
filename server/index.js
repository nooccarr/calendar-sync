require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const compression = require('compression');
const { logEvents, logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const axios = require('axios');
const { format, parseISO } = require('date-fns');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3000;

// config
const { ACUITY_EVENTS, APPOINTMENT_TYPES, OPERATORY } = require('./config/events');

// model
const Appointment = require('./model/Appointment');

// utility helpers
const { formatDateOfBirth, formatPhoneNumber, toStartOfWeek } = require('./utils/index').Acuity;
const { apiErrorHandler } = require('./utils/index').Error;

// helpers
const acuityApiHelpers = require('./helpers/acuityApiHelpers');
const acuityWebhookHelpers = require('./helpers/acuityWebhookHelpers');
const openDentalApiHelpers = require('./helpers/openDentalApiHelpers');

// connect to MongoDB
connectDB();

// middleware
app.use(compression());

// middleware: custom
app.use(logger);

// middleware: built-in
app.use(express.json()); // application/json
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// route: webhook event
app.post('/notification', async (req, res) => {

  // // verify webhook request FIXME:
  // // Get hash of message using shared secret:
  // const hash = crypto.createHmac('sha256', process.env.ACUITY_API_KEY)
  //   .update(JSON.stringify(req.body))
  //   .digest('base64');

  // // Compare hash to Acuity signature:
  // if (hash !== req.header('X-Acuity-Signature')) {
  //   console.log('This message was forged');
  //   return res.status(403).json({ message: 'This message was forged!' });
  // } else {
  //   console.log('success');
  //   return res.json({ message: 'success' });
  // }

  const { action, id, appointmentTypeID } = req.body;

  logEvents(`${action}\tid:${id}\taptTypeId:${appointmentTypeID}`, 'webhookLog.log');

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

        const AppointmentTypeNum = patientCount < 2 ?
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
        const appointment = await Appointment.findOne({ aptId: id });

        if (!appointment) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update appointment
        const { aptNum } = appointment;

        const AptDateTime = format(parseISO(datetime), 'yyyy-MM-dd HH:mm:ss');

        const response = await openDentalApiHelpers.updateAppointment(aptNum, { AptDateTime });

        res.json({ message: `Updated an appointment with ID ${id}` });

        break;
      }
      case 'appointment.canceled': {
        // query the DB
        const appointment = await Appointment.findOne({ aptId: id });

        if (!appointment) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // update an appointment
        const { aptNum } = appointment;

        const AptDateTime = toStartOfWeek(datetime);

        const updateAppointment = await openDentalApiHelpers.updateAppointment(aptNum, { AptDateTime });

        // break an appointment
        const breakAppointment = await openDentalApiHelpers.breakAppointment(aptNum, { sendToUnscheduledList: false });

        res.json({ message: `Deleted an appointment with ID ${id}` });

        break;
      }
      case 'appointment.changed': {
        // query the DB
        const appointment = await Appointment.findOne({ aptId: id });

        if (!appointment) return res.status(400).json({ message: `An appointment with ID ${id} not found in the database` });

        // get a patient
        const { aptNum, patNum } = appointment;

        // TODO:  create Appointments GET (single) route -> /appointments/:id
        //        if GET /appointments/aptNum exists, do GET /patients/patNum

        const patient = await openDentalApiHelpers.listPatient(patNum);

        // update a patient
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

        break;
      }
      default: {
        res.json({ message: 'Invalid webhook event' });
      }
    }
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

// route: reset webhooks (new URL)
app.post('/subscription', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: 'URL required' });

  try {
    const webhooks = await acuityWebhookHelpers.listActiveWebhooks();

    const ids = webhooks.data.map(({ id }) => id);

    const deleteWebhooks = await axios.all(
      ids.map(
        async (id) => await acuityWebhookHelpers.deleteWebhook(id)
      )
    );

    const addWebhooks = await axios.all(
      ACUITY_EVENTS.map(
        async (event) => await acuityWebhookHelpers.createNewWebhook(event, `${url}/notification`)
      )
    );

    const subscribed = addWebhooks.map(({ data }) => data);

    res.json(subscribed);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

// route: populate database
app.post('/populate', async (req, res) => {

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
          }).catch(err => console.error(`${err.name}, ${err.message}, ${err.code}, ${err.response?.data}`));

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
            ).catch(err => console.error(`${err.name}, ${err.message}, ${err.code}, ${err.response?.data}`));;

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
              // // store appointment in the database
              // const { AptNum } = appointments.data[0];

              // const newAppointmentDB = await Appointment.create({
              //   aptId: id,
              //   patNum: PatNum,
              //   aptNum: AptNum
              // }).catch(err => {
              //   logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
              //   console.error(err.stack);
              // });

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
    apiErrorHandler(err, req, res);
  }
});

// routes: Acuity Webhook API
app.get('/acuity/webhook', async (req, res) => {
  try {
    const { data } = await acuityWebhookHelpers.listActiveWebhooks();

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.post('/acuity/webhook', async (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) return res.status(400).json({ message: 'Event and target are required' });

  try {
    const { data } = await acuityWebhookHelpers.createNewWebhook(event, target);

    res.status(201).json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.delete('/acuity/webhook/:id', async (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const response = await acuityWebhookHelpers.deleteWebhook(id);

    res.json({ message: `A subscription with the id '${id}' deleted` });
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

// routes: Acuity Scheduling API
app.get('/acuity/appointments', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointments(req.query);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/acuity/appointments/:id', async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const { data } = await acuityApiHelpers.listAppointmentById(req.query);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/acuity/appointment-types', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointmentTypes(req.query);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/acuity/calendars', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listCalendars();

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/acuity/forms', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listForms();

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

// routes: Open Dental API
app.get('/opendental/patients', async (req, res) => {
  try {
    const { data } = await openDentalApiHelpers.listPatients(req.query);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/opendental/patients/:id', async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) return res.status(400).json({ message: 'Patient number required' })

  try {
    const { data } = await openDentalApiHelpers.listPatient(PatNum);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.get('/opendental/appointments', async (req, res) => {
  try {
    const { data } = await openDentalApiHelpers.listAppointments(req.query);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.post('/opendental/patients', async (req, res) => {
  const { LName, FName, Birthdate } = req.body;

  if (!LName || !FName) return res.status(400).json({ message: 'Last name and first name are required' });

  if (!Birthdate) req.body.Birthdate = '0001-01-01';

  try {
    const { data } = await openDentalApiHelpers.createNewPatient(req.body);

    res.status(201).json(data); // automatically ignores duplicates
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.post('/opendental/appointments', async (req, res) => {
  const { PatNum, AptDateTime } = req.body; // AppointmentTypeNum: 2 ~ 5

  if (!PatNum || !AptDateTime) {
    return res.status(400).json({ message: 'Patient number and appointment date & time required' });
  }

  req.body.Op = 1;

  try {
    const { data } = await openDentalApiHelpers.createNewAppointment(req.body);

    res.status(201).json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.put('/opendental/appointments/:id', async (req, res) => {
  const { AptNum } = req.query;
  const { AptDateTime } = req.body;

  if (!AptNum) return res.status(400).json({ message: 'Appointment number required' });
  if (!AptDateTime) return res.status(400).json({ message: 'Appointment date & time required' });

  try {
    const response = await openDentalApiHelpers.updateAppointment(AptNum, req.body);

    res.json({ message: `Updated an appointment with the id '${AptNum}'` }); // AptDateTime(ASC)
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.put('/opendental/appointments/:id/break', async (req, res) => {
  const { AptNum } = req.query;
  const { sendToUnscheduledList } = req.body;

  if (!AptNum) return res.status(400).json({ message: 'Appointment number required' });
  if (!sendToUnscheduledList) return res.status(400).json({ message: 'Send to unscheduled list required' });

  try {
    const response = await openDentalApiHelpers.breakAppointment(AptNum, req.body);

    res.json({ message: `Broke an appointment with the id '${id}'` });
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

app.put('/opendental/patients/:id', async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) return res.status(400).json({ message: 'Patient number required' });

  try {
    const { data } = await openDentalApiHelpers.updatePatient(PatNum, req.body);

    res.json(data);
  } catch (err) {
    apiErrorHandler(err, req, res);
  }
});

// routes: Appointments API
app.get('/appointments', async (req, res) => {
  const appointments = await Appointment.find();
  if (appointments?.length === 0) return res.status(204).json({ message: 'No appointments found' });
  res.json(appointments);
});

app.post('/appointments', async (req, res) => {
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
});

app.delete('/appointments', async (req, res) => {
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
});

// route: home
app.get('/', (req, res) => {
  res.send('Calendar Sync');
});

app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

// middleware: custom
app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', err => {
  logEvents(err.stack.split('\n')[0], 'mongoErrLog.log');
  console.error(err.stack);
})

// FIXME:
// [v] update subscriptions to new ngrok public ip address
// [v] :id should be retrieved from req.query when making GET/DELETE request.

// TODO:
// [v] use GET /appointments to make API call to OpenDental
// [v] create OpenDental helpers
// [v] create OpenDental routes
// [v] implement async await on all routes
// [v] create a POST route (delete all subscriptions. Then add all subscriptions under new public URL)
// [v] integrate OpenDental into POST /notification. use 'switch & cases'
// [ ] use MVC framework pattern