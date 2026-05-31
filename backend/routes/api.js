const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// ===== NOTES =====
router.get('/notes', async (req, res) => {
  const { data, error } = await supabase.from('notes').select('*').eq('user_id', req.user.id).order('updated_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/notes', async (req, res) => {
  const { data, error } = await supabase.from('notes').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/notes/:id', async (req, res) => {
  const { data, error } = await supabase.from('notes').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/notes/:id', async (req, res) => {
  const { error } = await supabase.from('notes').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== TODOS =====
router.get('/todos', async (req, res) => {
  const { data, error } = await supabase.from('todos').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/todos', async (req, res) => {
  const { data, error } = await supabase.from('todos').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/todos/:id', async (req, res) => {
  const { data, error } = await supabase.from('todos').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/todos/:id', async (req, res) => {
  const { error } = await supabase.from('todos').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== GOALS =====
router.get('/goals', async (req, res) => {
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/goals', async (req, res) => {
  const { data, error } = await supabase.from('goals').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/goals/:id', async (req, res) => {
  const { data, error } = await supabase.from('goals').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/goals/:id', async (req, res) => {
  const { error } = await supabase.from('goals').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== EVENTS =====
router.get('/events', async (req, res) => {
  const { data, error } = await supabase.from('events').select('*').eq('user_id', req.user.id).order('date', { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/events', async (req, res) => {
  const { data, error } = await supabase.from('events').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/events/:id', async (req, res) => {
  const { data, error } = await supabase.from('events').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/events/:id', async (req, res) => {
  const { error } = await supabase.from('events').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== DIARY =====
router.get('/diary', async (req, res) => {
  const { data, error } = await supabase.from('diary_entries').select('*').eq('user_id', req.user.id).order('date', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/diary', async (req, res) => {
  const { data, error } = await supabase.from('diary_entries').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/diary/:id', async (req, res) => {
  const { data, error } = await supabase.from('diary_entries').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/diary/:id', async (req, res) => {
  const { error } = await supabase.from('diary_entries').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== LINKS =====
router.get('/links', async (req, res) => {
  const { data, error } = await supabase.from('links').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/links', async (req, res) => {
  const { data, error } = await supabase.from('links').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/links/:id', async (req, res) => {
  const { data, error } = await supabase.from('links').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/links/:id', async (req, res) => {
  const { error } = await supabase.from('links').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== LIBRARY =====
router.get('/library', async (req, res) => {
  const { data, error } = await supabase.from('library_items').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/library', async (req, res) => {
  const { data, error } = await supabase.from('library_items').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/library/:id', async (req, res) => {
  const { data, error } = await supabase.from('library_items').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/library/:id', async (req, res) => {
  const { error } = await supabase.from('library_items').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== VAULT =====
router.get('/vault', async (req, res) => {
  const { data, error } = await supabase.from('vault_entries').select('id,service,login,enc_password,url,notes,created_at,updated_at').eq('user_id', req.user.id).order('service');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/vault', async (req, res) => {
  const { data, error } = await supabase.from('vault_entries').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/vault/:id', async (req, res) => {
  const { data, error } = await supabase.from('vault_entries').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/vault/:id', async (req, res) => {
  const { error } = await supabase.from('vault_entries').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});
router.post('/vault/setup', async (req, res) => {
  const { master_hash, salt } = req.body;
  const { data, error } = await supabase.from('vault_config').upsert({ user_id: req.user.id, master_hash, salt }, { onConflict: 'user_id' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.get('/vault/config', async (req, res) => {
  const { data, error } = await supabase.from('vault_config').select('master_hash,salt').eq('user_id', req.user.id).single();
  if (error && error.code !== 'PGRST116') return res.status(400).json({ error: error.message });
  res.json(data || null);
});

// ===== STUDY =====
router.get('/study/subjects', async (req, res) => {
  const { data, error } = await supabase.from('study_subjects').select('*').eq('user_id', req.user.id).order('name');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/study/subjects', async (req, res) => {
  const { data, error } = await supabase.from('study_subjects').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.put('/study/subjects/:id', async (req, res) => {
  const { data, error } = await supabase.from('study_subjects').update(req.body).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.delete('/study/subjects/:id', async (req, res) => {
  const { error } = await supabase.from('study_subjects').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});
router.get('/study/sessions', async (req, res) => {
  const { data, error } = await supabase.from('study_sessions').select('*').eq('user_id', req.user.id).order('start_time', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/study/sessions', async (req, res) => {
  const { data, error } = await supabase.from('study_sessions').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ===== ACTIVITY =====
router.get('/activity', async (req, res) => {
  const { data, error } = await supabase.from('activity_log').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/activity', async (req, res) => {
  const { data, error } = await supabase.from('activity_log').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

// ===== SETTINGS =====
router.get('/settings', async (req, res) => {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', req.user.id).single();
  if (error && error.code !== 'PGRST116') return res.status(400).json({ error: error.message });
  res.json(data?.settings || {});
});
router.put('/settings', async (req, res) => {
  const { data, error } = await supabase.from('user_settings').upsert({ user_id: req.user.id, settings: req.body }, { onConflict: 'user_id' }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// ===== FILE FOLDERS =====
router.get('/file/folders', async (req, res) => {
  const { data, error } = await supabase.from('file_folders').select('*').eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
router.post('/file/folders', async (req, res) => {
  const { data, error } = await supabase.from('file_folders').insert({ ...req.body, user_id: req.user.id }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});
router.delete('/file/folders/:id', async (req, res) => {
  const { error } = await supabase.from('file_folders').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Excluído' });
});

// ===== EXPORT =====
router.get('/export', async (req, res) => {
  try {
    const uid = req.user.id;
    const [notes, todos, goals, events, diary, links, library, subjects, sessions] = await Promise.all([
      supabase.from('notes').select('*').eq('user_id', uid),
      supabase.from('todos').select('*').eq('user_id', uid),
      supabase.from('goals').select('*').eq('user_id', uid),
      supabase.from('events').select('*').eq('user_id', uid),
      supabase.from('diary_entries').select('*').eq('user_id', uid),
      supabase.from('links').select('*').eq('user_id', uid),
      supabase.from('library_items').select('*').eq('user_id', uid),
      supabase.from('study_subjects').select('*').eq('user_id', uid),
      supabase.from('study_sessions').select('*').eq('user_id', uid)
    ]);
    res.json({ exported_at: new Date().toISOString(), user: { id: uid, email: req.user.email }, notes: notes.data, todos: todos.data, goals: goals.data, events: events.data, diary: diary.data, links: links.data, library: library.data, study: { subjects: subjects.data, sessions: sessions.data } });
  } catch { res.status(500).json({ error: 'Erro ao exportar' }); }
});

module.exports = router;
