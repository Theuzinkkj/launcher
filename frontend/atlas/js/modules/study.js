/* ============================================================
   ATLAS HUB — study.js
   Estudos module
   ============================================================ */
const Study = (() => {
  const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
  const SUBJECT_ICONS = ['📚','🔬','💻','🎨','🎵','🏛️','🌍','🧮'];

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function thisWeekStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function formatDuration(mins) {
    if (!mins) return '0min';
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  }

  /* ---- stats ---- */
  function calcStats() {
    const sessions  = Storage.get('study.sessions') || [];
    const subjects  = Storage.get('study.subjects')  || [];
    const weekStart = thisWeekStart();

    const totalMins = sessions.reduce((s, ss) => s + (ss.duration || 0), 0);
    const weekMins  = sessions
      .filter(ss => new Date(ss.createdAt) >= weekStart)
      .reduce((s, ss) => s + (ss.duration || 0), 0);

    return {
      totalHours:   (totalMins / 60).toFixed(1),
      weekHours:    (weekMins  / 60).toFixed(1),
      subjects:     subjects.length,
      sessions:     sessions.length
    };
  }

  /* ---- render ---- */
  function render() {
    renderStats();
    renderGrid();
  }

  function renderStats() {
    const statsEl = document.getElementById('studyStats');
    if (!statsEl) return;
    const s = calcStats();
    statsEl.innerHTML = `
      <div class="study-stat"><div class="study-stat-value">${s.totalHours}h</div><div class="study-stat-label">Total de horas</div></div>
      <div class="study-stat"><div class="study-stat-value">${s.weekHours}h</div><div class="study-stat-label">Esta semana</div></div>
      <div class="study-stat"><div class="study-stat-value">${s.subjects}</div><div class="study-stat-label">Matérias</div></div>
      <div class="study-stat"><div class="study-stat-value">${s.sessions}</div><div class="study-stat-label">Sessões</div></div>
    `;
  }

  function renderGrid() {
    const grid  = document.getElementById('studyGrid');
    const empty = document.getElementById('studyEmpty');
    if (!grid) return;

    const subjects = Storage.get('study.subjects') || [];
    const sessions = Storage.get('study.sessions') || [];

    if (!subjects.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = subjects.map(sub => {
      const subSessions  = sessions.filter(s => s.subjectId === sub.id);
      const totalMins    = subSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      const lastSession  = subSessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const colorIdx     = COLORS.indexOf(sub.color);
      const icon         = SUBJECT_ICONS[colorIdx >= 0 ? colorIdx % SUBJECT_ICONS.length : 0];

      return `
        <div class="subject-card" data-id="${sub.id}">
          <div class="subject-color-bar" style="background:${sub.color||'var(--primary)'}"></div>
          <div class="subject-icon" style="background:${sub.color||'var(--primary)'}22;color:${sub.color||'var(--primary)'}">
            ${icon}
          </div>
          <div class="subject-name">${escHtml(sub.name)}</div>
          ${sub.description ? `<div class="subject-meta">${escHtml(sub.description.substring(0,60))}${sub.description.length>60?'…':''}</div>` : ''}
          <div class="subject-hours">${formatDuration(totalMins)}</div>
          <div class="subject-hours-label">total estudado${lastSession ? ` · última: ${formatDate(lastSession.createdAt)}` : ''}</div>
          <div class="subject-actions">
            <button class="btn btn-primary btn-sm" onclick="Study.startSession('${sub.id}')">▶ Sessão</button>
            <button class="btn btn-outline btn-sm" onclick="Study.openPomodoro()">🍅 Pomodoro</button>
            <button class="btn-icon" onclick="Study.deleteSubject('${sub.id}')">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- add subject ---- */
  function openAddSubject() {
    AtlasApp.openModal('Nova Matéria', `
      <div class="form-group">
        <label class="form-label">Nome *</label>
        <input type="text" id="subName" class="form-input" placeholder="Ex: Matemática, Programação...">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input type="text" id="subDesc" class="form-input" placeholder="Breve descrição...">
      </div>
      <div class="form-group">
        <label class="form-label">Cor</label>
        <div class="color-swatches" id="subColorPicker">
          ${COLORS.map((c, i) => `
            <div class="color-swatch ${i===0?'selected':''}" style="background:${c}" data-color="${c}"
                 onclick="Study._pickColor(this)"></div>`).join('')}
        </div>
        <input type="hidden" id="subColor" value="${COLORS[0]}">
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Criar', class: 'btn-primary', action: saveSubject }
    ]);
    setTimeout(() => { const inp = document.getElementById('subName'); if (inp) inp.focus(); }, 100);
  }

  function _pickColor(el) {
    document.querySelectorAll('#subColorPicker .color-swatch').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    const hidden = document.getElementById('subColor');
    if (hidden) hidden.value = el.dataset.color;
  }

  function saveSubject() {
    const name  = (document.getElementById('subName')  ||{}).value?.trim() || '';
    const desc  = (document.getElementById('subDesc')  ||{}).value?.trim() || '';
    const color = (document.getElementById('subColor') ||{}).value || COLORS[0];

    if (!name) { AtlasApp.toast('Informe o nome da matéria', 'error'); return; }

    Storage.push('study.subjects', {
      id: Storage.uid(), name, description: desc, color, reviews: [],
      createdAt: new Date().toISOString()
    });
    AtlasApp.toast('Matéria criada!', 'success');
    Storage.logActivity('Estudos', `"${name}" adicionada`);
    AtlasApp.closeModal();
    render();
  }

  /* ---- start session ---- */
  function startSession(subjectId) {
    const sub = (Storage.get('study.subjects') || []).find(s => s.id === subjectId);
    if (!sub) return;
    AtlasApp.openModal(`Registrar Sessão — ${escHtml(sub.name)}`, `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Duração (minutos) *</label>
          <input type="number" id="sessDuration" class="form-input" placeholder="Ex: 30" min="1" max="480">
        </div>
        <div class="form-group">
          <label class="form-label">Horário início</label>
          <input type="time" id="sessStartTime" class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Conteúdo estudado</label>
        <input type="text" id="sessContent" class="form-input" placeholder="O que você estudou?">
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea id="sessNotes" class="form-input" rows="2" placeholder="Observações, dificuldades..."></textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Salvar Sessão', class: 'btn-primary', action: () => saveSession(subjectId, sub.name) }
    ]);
    setTimeout(() => { const inp = document.getElementById('sessDuration'); if (inp) inp.focus(); }, 100);
  }

  function saveSession(subjectId, subjectName) {
    const durationRaw = (document.getElementById('sessDuration')  ||{}).value || '';
    const content     = (document.getElementById('sessContent')   ||{}).value?.trim() || '';
    const notes       = (document.getElementById('sessNotes')     ||{}).value?.trim() || '';
    const startTime   = (document.getElementById('sessStartTime') ||{}).value || '';
    const duration    = parseInt(durationRaw, 10);

    if (!duration || duration <= 0) { AtlasApp.toast('Informe a duração', 'error'); return; }

    Storage.push('study.sessions', {
      id: Storage.uid(), subjectId, duration, content, notes, startTime,
      createdAt: new Date().toISOString()
    });
    AtlasApp.toast(`Sessão de ${formatDuration(duration)} salva!`, 'success');
    Storage.logActivity('Estudos', `${formatDuration(duration)} em "${subjectName}"`);
    AtlasApp.closeModal();
    render();
  }

  /* ---- pomodoro ---- */
  function openPomodoro() {
    AtlasApp.navigate('tools');
    if (typeof Tools !== 'undefined') {
      setTimeout(() => Tools.setTool('pomodoro'), 100);
    }
  }

  /* ---- delete subject ---- */
  function deleteSubject(id) {
    const sub = (Storage.get('study.subjects') || []).find(s => s.id === id);
    if (!sub) return;
    AtlasApp.openModal('Excluir Matéria', `
      <p>Excluir <strong>${escHtml(sub.name)}</strong> e todas as suas sessões?</p>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir',  class: 'btn-danger',  action: () => {
        Storage.remove('study.subjects', id);
        // also remove sessions
        const sessions = (Storage.get('study.sessions') || []).filter(s => s.subjectId !== id);
        localStorage.setItem('atlas_study.sessions', JSON.stringify(sessions));
        Storage.logActivity('Estudos', `"${sub.name}" excluída`);
        AtlasApp.toast('Matéria excluída', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- public API ---- */
  function init() {}

  return { init, render, openAddSubject, startSession, openPomodoro, startPomodoro: openPomodoro, deleteSubject, _pickColor };
})();
