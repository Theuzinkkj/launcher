const express = require('express');
const router = express.Router();
const { supabase, supabaseForUser } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || '' } }
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name },
      session: data.session,
      message: 'Conta criada!'
    });
  } catch {
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Email ou senha incorretos' });

    res.json({
      user: { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name },
      session: data.session
    });
  } catch {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
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
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token obrigatorio' });

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Refresh token invalido' });

    res.json({ session: data.session });
  } catch {
    res.status(500).json({ error: 'Erro ao renovar sessao' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

    const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/atlas/reset-password`
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Email de recuperacao enviado!' });
  } catch {
    res.status(500).json({ error: 'Erro ao enviar email' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { access_token, refresh_token, password } = req.body;
    if (!access_token || !refresh_token) return res.status(400).json({ error: 'Link de recuperacao invalido ou expirado' });
    if (!password) return res.status(400).json({ error: 'Nova senha obrigatoria' });
    if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

    const userClient = supabaseForUser(access_token);
    const { error: sessionError } = await userClient.auth.setSession({ access_token, refresh_token });
    if (sessionError) return res.status(400).json({ error: sessionError.message || 'Link de recuperacao invalido ou expirado' });

    const { data, error } = await userClient.auth.updateUser({ password });
    if (error) return res.status(400).json({ error: error.message || 'Nao foi possivel alterar a senha' });

    res.json({
      user: data.user ? { id: data.user.id, email: data.user.email, name: data.user.user_metadata?.name } : null,
      message: 'Senha alterada com sucesso!'
    });
  } catch {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

module.exports = router;
