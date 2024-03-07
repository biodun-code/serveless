const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin with service account
const serviceAccount = require('./gywd-414814-firebase-adminsdk-vglha-15ada6dfcc.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

// Use bodyParser to parse JSON body and cors for cross-origin requests
app.use(bodyParser.json());
app.use(cors());

// Endpoint to register device token and send a test notification
app.post('/register', async (req, res) => {
  const { token } = req.body;
  console.log('Registering device token:', token);

  // For demonstration, immediately try sending a notification after registering the token
  const message = {
    token: token,
    notification: {
      title: 'Test Notification',
      body: 'This is a test notification sent from the Node.js backend.',
    },
  };

  try {
    await admin.messaging().send(message);
    res.send({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send({ success: false, message: 'Failed to send notification', error: error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
