const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const DIST = path.join(__dirname, 'dist');

app.use(express.json());
app.use(express.static(DIST));

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ teams: {} }, null, 2));
}

function getData() { return JSON.parse(fs.readFileSync(DATA_FILE)); }
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function validateTeam(req, res, next) {
  const { teamId } = req.params;
  const pw = req.headers['x-team-password'];
  const data = getData();
  const team = data.teams[teamId];
  if (!team) return res.status(404).json({ error: 'Not found' });
  if (team.password && team.password !== pw) return res.status(401).json({ error: 'Unauthorized' });
  req.team = team;
  next();
}

const api = express.Router();
api.get('/teams', (req, res) => res.json(Object.keys(getData().teams)));
api.post('/teams/:teamId', (req, res) => {
  const { teamId } = req.params;
  const { password } = req.body;
  const data = getData();
  if (data.teams[teamId]) {
    return data.teams[teamId].password === password
      ? res.json({ success: true })
      : res.status(401).json({ error: 'Invalid password' });
  }
  data.teams[teamId] = { password, members: [], moods: {} };
  saveData(data);
  res.json({ success: true });
});
api.get('/:teamId/members', validateTeam, (req, res) => res.json(req.team.members));
api.post('/:teamId/members', validateTeam, (req, res) => {
  const { teamId } = req.params;
  const { name } = req.body;
  const data = getData();
  if (!data.teams[teamId].members.includes(name)) data.teams[teamId].members.push(name);
  saveData(data);
  res.json({ success: true, members: data.teams[teamId].members });
});
api.delete('/:teamId/members/:name', validateTeam, (req, res) => {
  const { teamId, name } = req.params;
  const data = getData();
  data.teams[teamId].members = data.teams[teamId].members.filter(m => m !== name);
  saveData(data);
  res.json({ success: true });
});
api.get('/:teamId/moods', validateTeam, (req, res) => res.json(req.team.moods));
api.post('/:teamId/moods', validateTeam, (req, res) => {
  const { teamId } = req.params;
  const { dateStr, member, mood } = req.body;
  const data = getData();
  if (!data.teams[teamId].moods[dateStr]) data.teams[teamId].moods[dateStr] = {};
  data.teams[teamId].moods[dateStr][member] = mood;
  saveData(data);
  res.json({ success: true });
});

app.use('/api', api);

app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, () => console.log('Niko-Niko OK en puerto ' + PORT));
