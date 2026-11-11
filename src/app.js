const express = require('express');
const { add, multiply } = require('./calculator');

const app = express();
app.use(express.json());

// Bump this to see a new version go live after each deploy
const VERSION = '1.0.0';

app.get('/', (req, res) => {
  res.send(`
    <h1>Node.js CI/CD Demo</h1>
    <p>Version: <b>${VERSION}</b></p>
    <p>Deployed automatically by GitHub Actions.</p>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: VERSION, uptime: process.uptime() });
});

app.get('/api/add', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return res.status(400).json({ error: 'a and b must be numbers' });
  }
  res.json({ result: add(a, b) });
});

app.get('/api/multiply', (req, res) => {
  const a = Number(req.query.a);
  const b = Number(req.query.b);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return res.status(400).json({ error: 'a and b must be numbers' });
  }
  res.json({ result: multiply(a, b) });
});

module.exports = app;
