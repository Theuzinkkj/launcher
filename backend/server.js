require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes    = require('./routes/auth');
const apiRoutes     = require('./routes/api');
const uploadRoutes  = require('./routes/upload');
const aiRoutes      = require('./routes/ai');
const fitnessRoutes = require('./routes/fitness');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND = path.join(__dirname, '..', 'frontend');

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: 'Muitas requisições.' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(FRONTEND, { maxAge: '1d', etag: true }));

app.use('/api/auth',    authRoutes);
app.use('/api/upload',  uploadRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api',         apiRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/',          (req, res) => res.sendFile(path.join(FRONTEND, 'index.html')));
app.get('/atlas',     (req, res) => res.sendFile(path.join(FRONTEND, 'atlas', 'index.html')));
app.get('/atlas/*',   (req, res) => res.sendFile(path.join(FRONTEND, 'atlas', 'index.html')));
app.get('/fitness',   (req, res) => res.sendFile(path.join(FRONTEND, 'fitness', 'index.html')));
app.get('/fitness/*', (req, res) => res.sendFile(path.join(FRONTEND, 'fitness', 'index.html')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(path.join(FRONTEND, 'index.html'));
  else res.status(404).json({ error: 'Rota não encontrada' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`✅ Hub rodando na porta ${PORT} — ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
