const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB:', err);
    return;
  }
  console.log('Connected to database successfully.');
});

app.post('/register-device', (req, res) => {
  const { deviceToken } = req.body;
  // Add any other vendor info from req.body as needed for your application logic

  const query = `
    INSERT INTO vendors (deviceToken)
    VALUES (?)
    ON DUPLICATE KEY UPDATE deviceToken = VALUES(deviceToken);
  `;

  db.query(query, [deviceToken], (error, results) => {
    if (error) {
      console.error('Failed to insert or update device token:', error);
      res.status(500).send('Error registering device token');
      return;
    }
    res.send({ message: 'Device token registered successfully', deviceToken });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
