require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// helpers
const apiHelpers = require('./helpers/apiHelpers');
const webhookHelpers = require('./helpers/webhookHelpers');

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.post('/notification', (req, res) => {
  console.log('Webhook Event:', req.body);
  res.status(200).send('ok');
});

app.get('/webhook', (req, res) => {
  webhookHelpers.listAllActiveWebhooks((err, response) => {
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

app.delete('/webhook', (req, res) => {
  const { id } = req.body; // subscription ID

  if (!id) return res.status(400).json({ message: 'ID required' });

  webhookHelpers.deleteWebhook(id, (err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json({ message: `Subscription with id ${id} deleted` });
    }
  })
});

app.get('/appointments', (req, res) => {
  apiHelpers.getAllAppointments((err, response) => {
    if (err) {
      const { status_code, message } = err.response.data;
      res.status(status_code).json({ message });
    } else {
      res.status(200).json(response.data);
    }
  })
});

app.get('/appointments/:id', (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ message: 'ID required' });

  apiHelpers.getAppointmentById(id, (err, response) => {
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

app.get('/', (req, res) => {
  res.send('Calendar Sync');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Webhook Event Object:

// {
//   action: 'appointment.scheduled',
//   id: '1068514360',
//   calendarID: '7521036',
//   appointmentTypeID: '38654330'
// }

// action: either scheduled rescheduled canceled changed depending on the action that initiated the webhook call
// id: the ID for the appointment, get the details through the get appointment API call
// calendarID: the ID of the calendar for the appointment.
// appointmentTypeID: the ID of the type of the appointment.