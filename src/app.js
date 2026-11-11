const fs = require('fs');
const path = require('path');
const express = require('express');
const { add, multiply } = require('./calculator');

const app = express();
app.use(express.json());

// Bump this to see a new version go live after each deploy
const VERSION = '1.0.0';

// deploy-info.json is written on the server by the pipeline at deploy time
function getDeployInfo() {
  try {
    const file = path.join(__dirname, '..', 'deploy-info.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return { environment: 'local', commit: 'n/a', run: 'n/a', deployedAt: 'n/a' };
  }
}

const ENV_COLORS = { dev: '#2563eb', stage: '#d97706', local: '#6b7280' };

app.get('/', (req, res) => {
  const info = getDeployInfo();
  const color = ENV_COLORS[info.environment] || '#16a34a';
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>CI/CD Demo - ${info.environment}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; color: #fff; background: ${color}; font-weight: 600; text-transform: uppercase; }
  td { padding: 4px 12px 4px 0; }
</style></head>
<body>
  <h1>Node.js CI/CD Demo</h1>
  <p><span class="badge">${info.environment}</span></p>
  <table>
    <tr><td>Version</td><td><b>${VERSION}</b></td></tr>
    <tr><td>Commit</td><td><code>${String(info.commit).slice(0, 7)}</code></td></tr>
    <tr><td>Pipeline run</td><td>#${info.run}</td></tr>
    <tr><td>Deployed at</td><td>${info.deployedAt}</td></tr>
  </table>
  <p>Deployed automatically by GitHub Actions.</p>
</body></html>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: VERSION, ...getDeployInfo(), uptime: process.uptime() });
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
