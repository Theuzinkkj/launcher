const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.use(requireAuth);

router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Mensagem obrigatória' });
  if (!process.env.GROQ_API_KEY) return res.status(503).json({ error: 'IA não configurada. Adicione GROQ_API_KEY.' });

  try {
    const uid = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [todos, notes, goals, events, diary, sessions, subjects, links, library] = await Promise.all([
      supabase.from('todos').select('title,priority,done,due_date').eq('user_id', uid).eq('done', false).limit(20),
      supabase.from('notes').select('title,pinned,category').eq('user_id', uid).order('updated_at', { ascending: false }).limit(10),
      supabase.from('goals').select('title,progress,deadline').eq('user_id', uid).eq('completed', false).limit(10),
      supabase.from('events').select('title,date,time').eq('user_id', uid).gte('date', today).order('date').limit(10),
      supabase.from('diary_entries').select('date,mood').eq('user_id', uid).order('date', { ascending: false }).limit(7),
      supabase.from('study_sessions').select('duration,start_time,subject_id').eq('user_id', uid).gte('start_time', weekAgo),
      supabase.from('study_subjects').select('id,name').eq('user_id', uid),
      supabase.from('links').select('title,favorite').eq('user_id', uid).limit(10),
      supabase.from('library_items').select('title,status,progress').eq('user_id', uid).limit(10)
    ]);

    const overdueTodos = (todos.data || []).filter(t => t.due_date && t.due_date < today);
    const highPrio = (todos.data || []).filter(t => t.priority === 'high');
    const weekMins = (sessions.data || []).reduce((a, s) => a + (s.duration || 0), 0);
    const subjectMap = {};
    (subjects.data || []).forEach(s => { subjectMap[s.id] = s.name; });

    const systemPrompt = `Você é o Atlas Assistant, assistente pessoal integrado ao hub Atlas.
Responda em português brasileiro, de forma direta e útil.

=== DADOS DO USUÁRIO — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ===
📋 TAREFAS PENDENTES: ${(todos.data || []).length}
${highPrio.length ? `🔴 Alta prioridade: ${highPrio.slice(0,3).map(t=>t.title).join(', ')}` : ''}
${overdueTodos.length ? `⚠️ Atrasadas: ${overdueTodos.slice(0,3).map(t=>`${t.title} (venceu ${t.due_date})`).join('; ')}` : '✅ Nenhuma atrasada'}
📝 NOTAS: ${(notes.data||[]).length}
🎯 METAS: ${(goals.data||[]).map(g=>`${g.title}: ${g.progress}%`).join(', ') || 'Nenhuma'}
📅 EVENTOS: ${(events.data||[]).slice(0,3).map(e=>`${e.date}: ${e.title}`).join(', ') || 'Nenhum'}
📚 ESTUDO SEMANA: ${Math.floor(weekMins/60)}h${weekMins%60}m
😊 HUMOR: ${(diary.data||[]).map(d=>`${d.date}:${d.mood||'-'}`).join(' | ') || 'Sem registros'}
🔗 LINKS: ${(links.data||[]).length} | 📖 BIBLIOTECA: ${(library.data||[]).filter(i=>i.status==='reading').length} em andamento
===
Para criar/modificar dados, oriente o usuário a usar os módulos do Atlas. Não acessa o cofre de senhas.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content ?? '' });
  } catch (err) {
    console.error('AI error:', err.message);
    if (err?.status === 429) return res.status(429).json({ error: 'Limite Groq atingido. Tente em segundos.' });
    res.status(500).json({ error: 'Erro ao processar com IA.' });
  }
});

module.exports = router;
