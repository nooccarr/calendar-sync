require('dotenv').config();
const express = require('express');
const app = express();
const compression = require('compression');
const { format } = require('date-fns');
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

  try {
    // event handler goes here

    res.sendStatus(200);
  } catch (err) {
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

// routes: Acuity Webhook API
app.get('/acuity/webhook', async (req, res) => {
  try {
    const response = await acuityWebhookHelpers.listActiveWebhooks();

    res.json(response.data);
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
    const response = await acuityWebhookHelpers.createNewWebhook(event, target);

    res.status(201).json(response.data);
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
    const response = await acuityApiHelpers.listAppointments(req.query);

    res.json(response.data);
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
    const response = await acuityApiHelpers.listAppointmentById(id);

    res.json(response.data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/appointment-types', async (req, res) => {
  try {
    const response = await acuityApiHelpers.listAppointmentTypes(req.query);

    res.json(response.data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/calendars', async (req, res) => {
  try {
    const response = await acuityApiHelpers.listCalendars();

    res.json(response.data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

app.get('/acuity/forms', async (req, res) => {
  try {
    const response = await acuityApiHelpers.listForms();

    res.json(response.data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status_code, message } = err.response.data;
    res.status(status_code).json({ message });
  }
});

// routes: Open Dental API
app.get('/opendental/patients', async (req, res) => {
  try {
    const response = await openDentalApiHelpers.listPatients(req.query);

    res.json(response.data);
  } catch (err) {
    console.log(err);
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.get('/opendental/appointments', async (req, res) => {
  try {
    const response = await openDentalApiHelpers.listAppointments(req.query);

    res.json(response.data);
  } catch (err) {
    if (!err.response) return res.json({ error: err.message });
    const { status, data } = err.response;
    res.status(status).json({ message: data });
  }
});

app.post('/opendental/patients', (req, res) => {
  openDentalApiHelpers.createNewPatient(req.body, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.post('/opendental/appointments', (req, res) => {
  openDentalApiHelpers.createNewAppointment(req.body, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
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
// [ ] integrate OpenDental into POST /notification. use 'switch & cases'
// [ ] implement async await on all routes
// [ ] starter node file (delete all subscriptions. Then add subscriptions to new public URL)