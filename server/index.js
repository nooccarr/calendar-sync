require('dotenv').config();
const express = require('express');
const app = express();
const compression = require('compression');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const axios = require('axios');
const { format, parseISO, startOfWeek, differenceInDays, subDays } = require('date-fns');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const PORT = process.env.PORT || 3000;

// config
const APPOINTMENT_TYPE_LIST = require('./config/appointment_type_list');
const EVENTS_LIST = require('./config/events_list');

// model
const Appointment = require('./model/Appointment');

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
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mma');
  console.log(`Webhook Event ${timestamp}`, req.body);

  const { action, id, appointmentTypeID } = req.body;

  try {
    // get an appointment with matching ID
    const appointment = await acuityApiHelpers.listAppointmentById({ id, pastFormAnswers: 'false' });

    let { firstName, lastName, birthDate, phone, email, datetime } = appointment.data; // integrate DOB in Acuity

    birthDate = birthDate || '0001-01-01';

    // event handler goes here
    switch (action) {
      case 'appointment.scheduled': {
        // get a list of patients
        const patients = await openDentalApiHelpers.listPatients({
          // LName: lastName.slice(0, 2), NOTE: if an incorrect patient is pulled, appointment.changed will overwrite patient information
          // FName: firstName.slice(0, 2),
          LName: lastName,
          FName: firstName,
          Birthdate: birthDate // FIXME: integrate DOB in Acuity.
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
          APPOINTMENT_TYPE_LIST[appointmentTypeID] :
          APPOINTMENT_TYPE_LIST['manyEntriesFound'];

        const newAppointment = await openDentalApiHelpers.createNewAppointment({
          PatNum, AptDateTime, AppointmentTypeNum, Op: 1
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

        const dateTime = parseISO(datetime);
        const weekStartDate = startOfWeek(dateTime);
        const difference = differenceInDays(dateTime, weekStartDate);
        const newDateTime = subDays(dateTime, difference);
        const AptDateTime = format(newDateTime, 'yyyy-MM-dd HH:mm:ss');

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
        const { patNum } = appointment;

        const patient = await openDentalApiHelpers.listPatient(patNum);

        // update a patient
        const { LName, FName, Birthdate, WirelessPhone, Email } = patient.data;

        phone = phone.length === 10 ?
          '(' + phone.slice(0, 3) + ')' + phone.slice(3, 6) + '-' + phone.slice(6) :
          phone.length === 11 ?
            phone[0] + '(' + phone.slice(1, 4) + ')' + phone.slice(4, 7) + '-' + phone.slice(7) :
            '';

        console.log('AC:', lastName, firstName, birthDate, phone, email);
        console.log('OD:', LName, FName, Birthdate, WirelessPhone, Email);

        if (LName !== lastName || FName !== firstName || Birthdate !== birthDate || WirelessPhone !== phone || Email !== email) {
          const updatePatient = await openDentalApiHelpers.updatePatient(patNum, {
            LName: lastName || LName,
            FName: firstName || FName,
            Birthdate: birthDate !== '0001-01-01' ? birthDate : Birthdate,
            WirelessPhone: phone || WirelessPhone,
            Email: email || Email
          });
          console.log('appointment.change: Updated');
          res.json({ message: `Updated a patient with ID ${id}` });
        } else {
          console.log('appointment.change: No change');
          res.json({ message: 'Nothing here to change' });
        }

        break;
      }
      default: {
        res.json({ message: 'Invalid webhook event' });
      }
    }

  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
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
      EVENTS_LIST.map(
        async (event) => await acuityWebhookHelpers.createNewWebhook(event, `${url}/notification`)
      )
    );

    res.json({ message: 'Target updated for all subscription events' });
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

// route: populate database
app.post('/populate', async (req, res) => {

  try {
    // get all appointments
    const appointments = await acuityApiHelpers.listAppointments({ max: 1000 });

    appointments.data.map(async ({ id, lastName, firstName, phone, email, datetime }) => {
      const patients = await openDentalApiHelpers.listPatients({ LName: lastName, FName: firstName, Phone: phone });

      if (patients.data.length === 0) {
        console.log('NO PATIENT FOUND:', id, lastName, firstName, phone, email);
      } else if (patients.data.length > 1) {
        console.log('MANY PATIENTS FOUND:', id, lastName, firstName, phone, email);
        patients.data.map(({ PatNum, LName, FName, WirelessPhone, Email, Birthdate }) => {
          console.log(PatNum, LName, FName, WirelessPhone, Email, Birthdate);
        });
      } else {
        const { PatNum } = patients.data[0];

        const date = format(parseISO(datetime), 'yyyy-MM-dd');

        // GET /opendental/appointments
        // I: PatNum, datetime, O: AptNum, PatNum
        const appointments = await openDentalApiHelpers.listAppointments({ PatNum, date });

        // console.log('MATCHING:', id, lastName, firstName, phone, email);
        if (appointments.data.length === 0) console.log('NO APPOINTMENT FOUND');
        else if (appointments.data.length > 1) console.log('MANY APPOINTMENTS FOUND');
        else {
          const { AptNum } = appointments.data[0];
          // console.log(id, PatNum, AptNum);

          const newAppointmentDB = await Appointment.create({
            aptId: id,
            patNum: PatNum,
            aptNum: AptNum
          });
          console.log(newAppointmentDB);
          // res.status(201).json(newAppointmentDB);
        }
      }
    });

    res.json(appointments.data);
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      res.status(status).json({ message: data });
    } else {
      res.json({ error: err.message });
    }
  }
});

// routes: Acuity Webhook API
app.get('/acuity/webhook', async (req, res) => {
  try {
    const { data } = await acuityWebhookHelpers.listActiveWebhooks();

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.post('/acuity/webhook', async (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) return res.status(400).json({ message: 'Event and target are required' });

  try {
    const { data } = await acuityWebhookHelpers.createNewWebhook(event, target);

    res.status(201).json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.delete('/acuity/webhook/:id', async (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const response = await acuityWebhookHelpers.deleteWebhook(id);

    res.json({ message: `A subscription with the id '${id}' deleted` });
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

// routes: Acuity Scheduling API
app.get('/acuity/appointments', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointments(req.query);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/appointments/:id', async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'ID required' });

  try {
    const { data } = await acuityApiHelpers.listAppointmentById(req.query);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/appointment-types', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listAppointmentTypes(req.query);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/calendars', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listCalendars();

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/forms', async (req, res) => {
  try {
    const { data } = await acuityApiHelpers.listForms();

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

// routes: Open Dental API
app.get('/opendental/patients', async (req, res) => {
  try {
    const { data } = await openDentalApiHelpers.listPatients(req.query);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.get('/opendental/patients/:id', async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) return res.status(400).json({ message: 'Patient number required' })

  try {
    const { data } = await openDentalApiHelpers.listPatient(PatNum);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.get('/opendental/appointments', async (req, res) => {
  try {
    const { data } = await openDentalApiHelpers.listAppointments(req.query);

    res.json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
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
    if (!err.response) return res.json({ error: err.message });
    console.log(err.response.config);
    const { status, data } = err.response;
    res.status(status).json({ message: data });
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
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
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
    if (err.response) {
      const { status, data } = err.response;
      res.status(status).json({ message: data });
    } else {
      res.json({ error: err.message });
    }
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
    if (err.response) {
      const { status, data } = err.response;
      res.status(status).json({ message: data });
    } else {
      res.json({ error: err.message });
    }
  }
});

app.put('/opendental/patients/:id', async (req, res) => {
  const { PatNum } = req.query;

  if (!PatNum) return res.status(400).json({ message: 'Patient number required' });

  try {
    const { data } = await openDentalApiHelpers.updatePatient(PatNum, req.body);

    res.json(data);
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      res.status(status).json({ message: data });
    } else {
      res.json({ error: err.message });
    }
  }
});

// routes: Appointments API
app.get('/appointments', async (req, res) => {
  const appointments = await Appointment.find();
  if (!appointments?.length) return res.status(204).json({ message: 'No appointments found' });
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
    res.json({ error: err.message });
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
    res.json({ error: err.message });
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
// [ ] use MVC framework pattern
// [v] integrate OpenDental into POST /notification. use 'switch & cases'