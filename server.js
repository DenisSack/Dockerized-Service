require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');
  return { username, password };
}

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/secret', (req, res) => {
  const auth = parseBasicAuth(req.headers.authorization);
  if (!auth || auth.username !== process.env.USERNAME || auth.password !== process.env.PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secret Area"');
    return res.status(401).send('Unauthorized: Incorrect or missing credentials.');
  }
  res.send(process.env.SECRET_MESSAGE);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});