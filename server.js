const express = require('express');
const bodyParser = require('body-parser');
const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();
const app = express();
app.use(bodyParser.json());

app.post('/send-notification', async (req, res) => {
  const { to, sound, title, body, data } = req.body;
  let messages = [];

  // Basic validation to check if token looks like a valid Expo push token
  if (!Expo.isExpoPushToken(to)) {
    console.error(`Push token ${to} is not a valid Expo push token`);
    res.status(400).send({ error: `Push token ${to} is not a valid Expo push token` });
    return;
  }

  messages.push({
    to,
    sound,
    title,
    body,
    data,
  });

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  res.send({ status: 'success', message: 'Notification sent successfully!', tickets });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
