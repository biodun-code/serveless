const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const axios = require('axios'); // Import axios
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000; // You can choose any port

// Replace these with your actual MySQL database connection details
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

app.use(cors()); // Use CORS to allow requests from your frontend
app.use(bodyParser.json());

// Endpoint to register a device's push token
app.post('/register-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).send('Token is required');
  }

  const query = 'INSERT INTO users (expoPushToken) VALUES (?) ON DUPLICATE KEY UPDATE expoPushToken = VALUES(expoPushToken);';
  db.query(query, [token], (error) => {
    if (error) {
      console.error('Failed to register token:', error);
      return res.status(500).send('Error registering token');
    }
    res.send('Token registered successfully');
  });
});

// Endpoint to send a push notification
app.post('/send-notification', (req, res) => {
  const { recipientId, message } = req.body;
  if (!recipientId || !message) {
    return res.status(400).send('Recipient ID and message are required');
  }

  // Query the database to get the recipient's expoPushToken
  const query = 'SELECT expoPushToken FROM users WHERE id = ?';
  db.query(query, [recipientId], (error, results) => {
    if (error) {
      console.error('Failed to fetch recipient token:', error);
      return res.status(500).send('Error fetching recipient token');
    }
    if (results.length === 0) {
      return res.status(404).send('Recipient not found');
    }

    const recipientToken = results[0].expoPushToken;
    const notificationMessage = {
      to: recipientToken,
      sound: 'default',
      title: 'New Message',
      body: message,
    };

    // Using axios to send the push notification
    axios.post('https://exp.host/--/api/v2/push/send', notificationMessage, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    })
    .then(() => res.send('Notification sent successfully'))
    .catch((error) => {
      console.error('Error sending notification:', error);
      res.status(500).send('Error sending notification');
    });
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
