const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
// For persistence across Railway redeploys: add a volume and set DATA_PATH=/data/gantt.json
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, 'gantt-data.json');
const SECRET = process.env.GANTT_SECRET || '';

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-gantt-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

function auth(req, res, next) {
  if (!SECRET) return next();
  if (req.headers['x-gantt-key'] !== SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/api/data', auth, (req, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) return res.json(null);
    res.json(JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')));
  } catch {
    res.json(null);
  }
});

app.post('/api/data', auth, (req, res) => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(req.body));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`GANTT server running on port ${PORT}`));
