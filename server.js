require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const DIST = path.join(__dirname, 'dist');

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI no está definida en las variables de entorno.');
  process.exit(1);
}

// ── Conexión a MongoDB ──────────────────────────────────────────────────────
let db;
const client = new MongoClient(MONGODB_URI);

async function connectDB() {
  await client.connect();
  db = client.db('nikoniko');
  console.log('Conectado a MongoDB Atlas ✓');
}

function teams() {
  return db.collection('teams');
}

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(DIST));

// ── Middleware de validación de equipo ──────────────────────────────────────
async function validateTeam(req, res, next) {
  const { teamId } = req.params;
  const pw = req.headers['x-team-password'];
  const team = await teams().findOne({ _id: teamId });
  if (!team) return res.status(404).json({ error: 'No encontrado' });
  if (team.password && team.password !== pw) return res.status(401).json({ error: 'No autorizado' });
  req.team = team;
  next();
}

// ── Rutas API ───────────────────────────────────────────────────────────────
const api = express.Router();

// GET /api/teams — lista de nombres de equipos
api.get('/teams', async (req, res) => {
  try {
    const allTeams = await teams().find({}, { projection: { _id: 1 } }).toArray();
    res.json(allTeams.map(t => t._id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/teams/:teamId — crear o autenticar equipo
api.post('/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { password } = req.body;
    const existing = await teams().findOne({ _id: teamId });

    if (existing) {
      return existing.password === password
        ? res.json({ success: true })
        : res.status(401).json({ error: 'Contraseña inválida' });
    }

    await teams().insertOne({ _id: teamId, password: password || null, members: [], moods: {} });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/:teamId/members
api.get('/:teamId/members', validateTeam, (req, res) => {
  res.json(req.team.members);
});

// POST /api/:teamId/members — agregar miembro
api.post('/:teamId/members', validateTeam, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name } = req.body;
    const result = await teams().findOneAndUpdate(
      { _id: teamId },
      { $addToSet: { members: name } },
      { returnDocument: 'after' }
    );
    res.json({ success: true, members: result.members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/:teamId/members/:name
api.delete('/:teamId/members/:name', validateTeam, async (req, res) => {
  try {
    const { teamId, name } = req.params;
    await teams().updateOne(
      { _id: teamId },
      { $pull: { members: name } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/:teamId/moods
api.get('/:teamId/moods', validateTeam, (req, res) => {
  res.json(req.team.moods);
});

// POST /api/:teamId/moods — registrar estado de ánimo
api.post('/:teamId/moods', validateTeam, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { dateStr, member, mood } = req.body;
    await teams().updateOne(
      { _id: teamId },
      { $set: { [`moods.${dateStr}.${member}`]: mood } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/:teamId/points?month=2026-5
api.get('/:teamId/points', validateTeam, async (req, res) => {
  try {
    const { month } = req.query;
    const pointsData = req.team.points || {};
    res.json(month ? (pointsData[month] || {}) : pointsData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:teamId/points — { member, month, delta }
api.post('/:teamId/points', validateTeam, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { member, month, delta } = req.body;
    const field = `points.${month}.${member}`;

    // Obtener valor actual para evitar negativos
    const current = req.team.points?.[month]?.[member] ?? 0;
    const newVal = Math.max(0, current + delta);
    await teams().updateOne(
      { _id: teamId },
      { $set: { [field]: newVal } }
    );
    res.json({ success: true, value: newVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Montar API y fallback SPA ───────────────────────────────────────────────
app.use('/api', api);
app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));

// ── Arrancar servidor tras conectar a MongoDB ───────────────────────────────
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Niko-Niko OK en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });
