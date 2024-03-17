const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { Expo } = require('expo-server-sdk');
require('dotenv').config();

const app = express();
const port = 3000;

// Create a new Expo SDK client
let expo = new Expo();

app.use(bodyParser.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    return;
  }
  console.log('Connected to database successfully.');
});

// Endpoint to register device tokens
app.post('/register-device', (req, res) => {
  const { deviceToken } = req.body;

  const query = `
    INSERT INTO vendors (deviceToken)
    VALUES (?)
    ON DUPLICATE KEY UPDATE deviceToken = VALUES(deviceToken);
  `;

  db.query(query, [deviceToken], (error) => {
    if (error) {
      console.error('Failed to insert or update device token:', error);
      res.status(500).send('Error registering device token');
      return;
    }
    res.send({ message: 'Device token registered successfully', deviceToken });
  });
});

// Endpoint to send notifications
app.post('/send-notification', (req, res) => {
  const { message } = req.body;

  const query = `SELECT deviceToken FROM vendors;`;

  db.query(query, async (error, results) => {
    if (error) {
      console.error('Failed to retrieve device tokens:', error);
      return res.status(500).send('Error retrieving device tokens');
    }

    let notifications = [];
    for (let row of results) {
      if (!Expo.isExpoPushToken(row.deviceToken)) {
        console.error(`Push token ${row.deviceToken} is not a valid Expo push token`);
        continue;
      }

      notifications.push({
        to: row.deviceToken,
        sound: 'default',
        body: message,
        data: { message },
      });
    }

    let chunks = expo.chunkPushNotifications(notifications);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }

    res.send({ message: 'Notification sent successfully.' });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
