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
app.post('/notification', (req, res) => {
  const timestamp = format(new Date(), 'MM/dd/yyyy @ hh:mma');
  console.log(`Webhook Event ${timestamp}`, req.body);
  res.status(200).send('ok');
});

// routes: Acuity Webhook API
app.get('/acuity/webhook', (req, res) => {
  acuityWebhookHelpers.listActiveWebhooks((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).end({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.post('/acuity/webhook', (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) return res.status(400).json({ message: 'Event and target are required' });

  acuityWebhookHelpers.createNewWebhook(event, target, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.delete('/acuity/webhook/:id', (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  acuityWebhookHelpers.deleteWebhook(id, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json({ message: `A subscription with the id '${id}' deleted` });
    }
  })
});

// routes: Acuity Scheduling API
app.get('/acuity/appointments', (req, res) => {
  acuityApiHelpers.listAppointments(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.get('/acuity/appointments/:id', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'ID required' });

  acuityApiHelpers.listAppointmentById(id, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.get('/acuity/appointment-types', (req, res) => {
  acuityApiHelpers.listAppointmentTypes(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.send(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.get('/acuity/calendars', (req, res) => {
  acuityApiHelpers.listCalendars((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.get('/acuity/forms', (req, res) => {
  acuityApiHelpers.listForms((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

// routes: Open Dental API
app.get('/opendental/patients', (req, res) => {
  openDentalApiHelpers.listPatients(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.get('/opendental/appointments', (req, res) => {
  openDentalApiHelpers.listAppointments(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
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