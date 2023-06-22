require('dotenv').config();
const express = require('express');
const app = express();
const { format } = require('date-fns');
const PORT = process.env.PORT || 3000;

// helpers
const apiHelpers = require('./helpers/apiHelpers');
const webhookHelpers = require('./helpers/webhookHelpers');

// middleware
app.use(express.json()); // application/json
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// route: webhook event
app.post('/notification', (req, res) => {
  const timestamp = format(new Date(), 'MM/dd/yyyy @ hh:mma');
  console.log(`Webhook Event ${timestamp}`, req.body);
  res.status(200).send('ok');
});

// routes: webhook API
app.get('/webhook', (req, res) => {
  webhookHelpers.listActiveWebhooks((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).end({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.post('/webhook', (req, res) => {
  const { event, target } = req.body; // target: webhook endpoint

  if (!event || !target) return res.status(400).json({ message: 'Event and target are required' });

  webhookHelpers.createNewWebhook(event, target, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.delete('/webhook/:id', (req, res) => {
  const { id } = req.query; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  webhookHelpers.deleteWebhook(id, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json({ message: `A subscription with the id '${id}' deleted` });
    }
  })
});

// routes: scheduling API
app.get('/appointments', (req, res) => {
  apiHelpers.listAppointments(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.get('/appointments/:id', (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: 'ID required' });

  apiHelpers.listAppointmentById(id, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

// app.post('/appointments', (req, res) => {
//   apiHelpers.createNewAppointment((err, response) => {
//     if (err) {
//       console.log(err.response.config)
//       console.log(err.response.data)
//       res.status(err.response.data.status_code).end();
//     } else {
//       console.log('DATA: ', response.data);
//       res.status(200).end();
//     }
//   })
// });

app.get('/appointment-types', (req, res) => {
  apiHelpers.listAppointmentTypes(req.query, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.send(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  });
});

app.get('/calendars', (req, res) => {
  apiHelpers.listCalendars((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.get('/forms', (req, res) => {
  apiHelpers.listForms((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
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
// [ ] use GET /appointments to make API call to OpenDental
// [ ] create OpenDental helpers
// [ ] integrate OpenDental into POST /notification. use 'switch & cases'