require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// helpers
const apiHelpers = require('./helpers/apiHelpers');
const webhookHelpers = require('./helpers/webhookHelpers');

// middleware
app.use(express.json());

// // event listener
// app.on('testEvent', () => {
//   console.log('the testEvent occured');
// })

// // event emitter
// app.get('/test', (req, res) => {
//   app.emit('testEvent');
//   return res.status(200).end();
// });

// routes
app.post('/notification', express.json({ type: 'application/json' }), (req, res) => {
  console.log(req.body);
  res.status(200).send('ok');
});

app.get('/webhook', (req, res) => {
  webhookHelpers.listAllActiveWebhooks((err, response) => {
    if (err) {
      console.error(err);
      res.status(400).end();
    } else {
      console.log('Subscriptions:', response.data);
      res.status(200).end();
    }
  })
});

app.post('/webhook', (req, res) => {
  webhookHelpers.createNewWebhook((err, response) => {
    if (err) {
      console.log('CONFIG:', err.config);
      console.log('DATA:', err.response.data);
      res.status(err.response.data.status_code).end();
    } else {
      console.log('Added Subscription:', response.data);
      res.status(200).end();
    }
  });
});

app.delete('/webhook', (req, res) => {
  webhookHelpers.deleteWebhook((err, response) => {
    if (err) {
      console.log(err.response.data);
      res.status(err.response.data.status_code).end();
    } else {
      console.log('Removed Subscription');
      res.status(200).send();
    }
  })
});

// app.get('/appointments', (req, res) => {
//   apiHelpers.listAllAppointments((err, response) => {
//     if (err) {
//       res.status(err.response.data.status_code).end();
//     } else {
//       console.log('DATA:', response);
//       res.status(200).end();
//     }
//   })
// });

// // FIXME:
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
  res.send('Hello world');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));