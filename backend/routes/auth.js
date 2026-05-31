const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: name || '' } } });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name }, session: data.session, message: 'Conta criada!' });
  } catch { res.status(500).json({ error: 'Erro ao criar conta' }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Email ou senha incorretos' });
    res.json({ user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name }, session: data.session });
  } catch { res.status(500).json({ error: 'Erro ao fazer login' }); }
});

router.post('/logout', requireAuth, async (req, res) => {
  try { await supabase.auth.signOut(); } catch {}
  res.json({ message: 'Logout realizado' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.user_metadata?.name || '' } });
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token obrigatório' });
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Refresh token inválido' });
    res.json({ session: data.session });
  } catch { res.status(500).json({ error: 'Erro ao renovar sessão' }); }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SITE_URL || 'http://localhost:3000'}/reset-password`
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Email de recuperação enviado!' });
  } catch { res.status(500).json({ error: 'Erro ao enviar email' }); }
});

module.exports = router;
