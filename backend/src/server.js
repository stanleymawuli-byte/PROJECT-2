require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { query, pool } = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');

const app = express();
const port = Number(process.env.PORT || 4000);
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim()), methods: ['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '100kb' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Try again later.' } }));

app.get('/api/health', async (_req, res) => {
  let database = 'disconnected';
  try { await query('SELECT 1'); database = 'connected'; } catch {}
  res.status(database === 'connected' ? 200 : 503).json({ status: database === 'connected' ? 'ok' : 'degraded', service: 'project-two-api', database });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/reports/summary', require('./middleware/auth').requireAuth, async (_req, res, next) => {
  try {
    const [users, records, recent] = await Promise.all([
      query('SELECT count(*)::int AS total, count(*) FILTER (WHERE is_active)::int AS active FROM users'),
      query('SELECT count(*)::int AS total, count(*) FILTER (WHERE status = $1)::int AS open FROM records', ['open']),
      query('SELECT action, count(*)::int AS total FROM audit_logs WHERE created_at >= now() - interval \'7 days\' GROUP BY action ORDER BY total DESC LIMIT 8')
    ]);
    res.json({ users: users.rows[0], records: records.rows[0], activity: recent.rows });
  } catch (error) { next(error); }
});
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error.message);
  if (error.code === '23505') return res.status(409).json({ error: 'A record with those unique details already exists.' });
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Unexpected server error.' : error.message });
});

const server = app.listen(port, () => console.log(`Project Two API listening on port ${port}`));
async function shutdown() { server.close(); await pool.end(); process.exit(0); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
