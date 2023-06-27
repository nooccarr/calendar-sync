require('dotenv').config();
const express = require('express');
const app = express();
const compression = require('compression');
const axios = require('axios');
const { format } = require('date-fns');
const EVENTS_LIST = require('./config/events_list');
const PORT = process.env.PORT || 3000;

// helpers
const acuityApiHelpers = require('./helpers/acuityApiHelpers');
const acuityWebhookHelpers = require('./helpers/acuityWebhookHelpers');
const openDentalApiHelpers = require('./helpers/openDentalApiHelpers');

// middleware
app.use(compression());
app.use(express.json()); // application/json
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// route: webhook event
app.post('/notification', async (req, res) => {
  const timestamp = format(new Date(), 'MM/dd/yyyy @ hh:mma');
  console.log(`Webhook Event ${timestamp}`, req.body);

  const { action, id, appointmentTypeId } = req.body;

  try {
    const appointment = await acuityApiHelpers.listAppointmentById({ id, pastFormAnswers: 'false' });
    const { firstName, lastName, phone, email, datetime, type } = appointment.data; // integrate DOB in Acuity
    // event handler goes here
    switch (action) {
      case 'appointment.scheduled':
        // get a list of patients
        const patients = await openDentalApiHelpers.listPatients({
          // LName: lastName,
          // FName: firstName,
          // Birthdate: '' // integrate DOB in Acuity
          LName: 'Thisis',
          FName: 'Test',
          Birthdate: ''
        });

        const length = patients.data.length;

        // TODO:
        // // if patient is not found, create a new patient
        // if (length === 0) {
        //   const newPatient = await openDentalApiHelpers.createNewPatient({
        //     LName: lastName,
        //     FName: firstName,
        //     Birthdate: '', // integrate DOB in Acuity
        //     WirelessPhone: phone,
        //     Email: email
        //   });
        // }

        // create a new appointment

        // store id, appointment number, and patient number to the DB


        // edge case: if more than 1 patient is found

        console.log(patients.data, length);

        break;
      case 'appointment.rescheduled':


        break;
      case 'appointment.canceled':


        break;
      // case 'appointment.changed':
      //   console.log(action + ' received');

      //   break;
      default:
        console.log('Invalid webhook event');
    }

    res.json({ message: 'event received' });
  } catch (err) {
    console.log(err);
    if (!err.response) return res.json({ message: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
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

    res.status(201).json(data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    console.log(err.response.config);
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.post('/opendental/appointments', async (req, res) => {
  const { PatNum, AptDateTime } = req.body;

  if (!PatNum || !AptDateTime) {
    return res.status(400).json({ message: 'Patient number and appointment date & time required' });
  }
  // AppointmentTypeNum: 2 ~ 5

  req.body.Op = 1;

  try {
    const { data } = await openDentalApiHelpers.createNewAppointment(req.body);

    res.status(201).json(data);
  } catch (err) {
    if (!err.response) return res.json({ message: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.put('/opendental/appointments/:AptNum', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'Appointment number required' });

  openDentalApiHelpers.updateAppointment(id, req.body, (req, res) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.put('/opendental/appointments/:AptNum/Break', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'Appointment number required' });

  openDentalApiHelpers.breakAppointment(id, req.body, (req, res) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

// route: home
app.get('/', (req, res) => {
  res.send('Calendar Sync');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
// [ ] integrate OpenDental into POST /notification. use 'switch & cases'