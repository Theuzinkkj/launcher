const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/\.(exe|bat|sh|cmd|msi|dmg)$/i.test(file.originalname)) return cb(new Error('Tipo não permitido'));
    cb(null, true);
  }
});

router.use(requireAuth);

router.post('/', upload.array('files', 20), async (req, res) => {
  try {
    const folder = req.body.folder || null;
    const uploaded = [];
    for (const file of req.files) {
      const filename = `${req.user.id}/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('atlas-files').upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uploadError) continue;
      const { data: urlData } = supabase.storage.from('atlas-files').getPublicUrl(filename);
      const { data: meta } = await supabase.from('files_metadata').insert({ user_id: req.user.id, name: file.originalname, size: file.size, type: file.mimetype, folder, storage_path: filename, public_url: urlData.publicUrl, created_at: new Date().toISOString() }).select().single();
      uploaded.push(meta);
    }
    res.json({ uploaded, count: uploaded.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/files', async (req, res) => {
  const folder = req.query.folder || null;
  const q = req.query.q || '';
  let query = supabase.from('files_metadata').select('*').eq('user_id', req.user.id);
  if (folder) query = query.eq('folder', folder); else query = query.is('folder', null);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.delete('/files/:id', async (req, res) => {
  const { data: file } = await supabase.from('files_metadata').select('storage_path').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (!file) return res.status(404).json({ error: 'Arquivo não encontrado' });
  await supabase.storage.from('atlas-files').remove([file.storage_path]);
  await supabase.from('files_metadata').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ message: 'Arquivo excluído' });
});

module.exports = router;
