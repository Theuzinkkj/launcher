/* ===== FITBOT — IA Fitness ===== */

const FitBot = (() => {
  let _history = [];
  const MAX = 10;

  function init() {
    const el = document.getElementById('fitbotModeBadge');
    if (el) el.innerHTML = navigator.onLine
      ? '<span class="ai-mode-badge">FitBot · Llama 3.3 via Groq</span>'
      : '<span style="font-size:.75rem;color:var(--text-muted)">Modo offline</span>';
  }

  function send() {
    const input = document.getElementById('fitbotInput');
    if (!input?.value.trim()) return;
    const msg = input.value.trim();
    input.value = '';
    query(msg);
  }

  async function query(text) {
    addMsg(text, 'user');
    const typing = showTyping();

    if (navigator.onLine) {
      try {
        const r = await FitnessAPI.post('/api/ai/chat', { message: text, history: _history.slice(-MAX) });
        typing.remove();
        if (r.ok) {
          _history.push({ role: 'user', content: text });
          _history.push({ role: 'assistant', content: r.data.reply });
          if (_history.length > MAX * 2) _history = _history.slice(-MAX * 2);
          addMsg(r.data.reply, 'bot', true);
          return;
        }
        if (r.error) FitnessApp.toast(r.error, 'warning');
      } catch { typing.remove(); }
    } else {
      typing.remove();
    }
    addMsg(localReply(text.toLowerCase()), 'bot');
  }

  function showTyping() {
    const chat = document.getElementById('fitbotChat');
    const el = document.createElement('div');
    el.className = 'assistant-message bot';
    el.innerHTML = `<div class="bot-avatar fit">💪</div><div class="message-bubble"><div class="bot-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    chat?.appendChild(el);
    if (chat) chat.scrollTop = chat.scrollHeight;
    return el;
  }

  function addMsg(text, role, isMarkdown = false) {
    const chat = document.getElementById('fitbotChat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = `assistant-message ${role}`;
    const content = isMarkdown ? renderMd(text) : esc(text);
    if (role === 'bot') div.innerHTML = `<div class="bot-avatar fit">💪</div><div class="message-bubble">${content}</div>`;
    else div.innerHTML = `<div class="message-bubble">${esc(text)}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  function renderMd(t) {
    return esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul style="padding-left:1.25rem;margin:.5rem 0">$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function localReply(q) {
    if (q.includes('abc') || q.includes('treino')) return '<p>💪 <strong>Treino ABC para Hipertrofia:</strong></p><p><strong>Treino A — Peito/Tríceps:</strong></p><ul><li>Supino reto: 4x8-12</li><li>Supino inclinado: 3x10-12</li><li>Crossover: 3x12-15</li><li>Tríceps corda: 4x10-12</li><li>Tríceps testa: 3x10-12</li></ul><p><strong>Treino B — Costas/Bíceps:</strong></p><ul><li>Puxada: 4x8-12</li><li>Remada curvada: 4x10</li><li>Rosca direta: 4x10-12</li></ul><p><strong>Treino C — Pernas:</strong></p><ul><li>Agachamento: 4x8-12</li><li>Leg press: 4x12</li><li>Cadeira extensora: 3x12-15</li><li>Panturrilha: 4x15-20</li></ul>';
    if (q.includes('macro') || q.includes('calori')) return '<p>🥗 <strong>Cálculo de Macros:</strong></p><p>Para <strong>hipertrofia</strong>: superávit de 300-500kcal/dia<br>Para <strong>emagrecimento</strong>: déficit de 300-500kcal/dia</p><p><strong>Distribuição sugerida:</strong></p><ul><li>Proteína: 1.8–2.2g por kg de peso</li><li>Gordura: 0.8–1g por kg</li><li>Carboidratos: resto das calorias</li></ul><p>Use meu perfil para calcular com precisão!</p>';
    if (q.includes('recup') || q.includes('descanso')) return '<p>😴 <strong>Dicas de Recuperação:</strong></p><ul><li>Durma 7-9 horas por noite</li><li>Hidrate-se — mín. 35ml por kg de peso</li><li>Consuma proteína pós-treino em até 2h</li><li>Considere creatina e BCAA</li><li>Massagem e alongamento ajudam</li><li>Respeite 48-72h de descanso por grupo muscular</li></ul>';
    if (q.includes('suplemento')) return '<p>💊 <strong>Suplementos Recomendados:</strong></p><ul><li>🥛 <strong>Whey Protein</strong> — pós-treino</li><li>⚡ <strong>Creatina</strong> — 3-5g/dia, qualquer horário</li><li>🍌 <strong>Carboidrato</strong> — pré-treino</li><li>🌙 <strong>Caseína</strong> — antes de dormir</li><li>☀️ <strong>Vitamina D3</strong> — suporte hormonal</li></ul><p><em>Consulte um nutricionista para orientação personalizada.</em></p>';
    if (q.includes('olá') || q.includes('oi') || q.includes('hey')) return '<p>Olá! 💪 Sou o <strong>FitBot</strong>, seu personal trainer e nutricionista virtual.</p><p style="margin-top:.5rem">Posso ajudar com:<br>• Montagem de treinos<br>• Cálculo de macros e dietas<br>• Técnica de exercícios<br>• Dicas de recuperação<br>• Suplementação</p><p style="margin-top:.5rem">O que deseja saber hoje?</p>';
    return '<p>Posso ajudar com treinos, nutrição, suplementação e recuperação. Tente perguntar sobre treino ABC, cálculo de macros, dicas de recuperação ou suplementos. 💪</p>';
  }

  function clear() {
    _history = [];
    const chat = document.getElementById('fitbotChat');
    if (!chat) return;
    chat.innerHTML = `<div class="assistant-message bot"><div class="bot-avatar fit">💪</div><div class="message-bubble"><p>Conversa limpa! Como posso ajudar?</p></div></div>`;
  }

  function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  return { init, send, query, clear };
})();
