/* ============================================================
   ATLAS HUB — goals.js
   Metas module
   ============================================================ */
const Goals = (() => {
  let currentFilter = 'all';

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(str) {
    if (!str) return 'Sem prazo';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr + 'T23:59:59').getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  function progressColor(pct) {
    if (pct >= 75) return 'green';
    if (pct >= 40) return 'yellow';
    return 'red';
  }

  const timelineLabels = { short: 'Curto prazo', medium: 'Médio prazo', long: 'Longo prazo' };

  /* ---- render ---- */
  function render() {
    let goals = Storage.get('goals') || [];

    if (currentFilter !== 'all') {
      goals = goals.filter(g => g.timeline === currentFilter);
    }

    const grid  = document.getElementById('goalsGrid');
    const empty = document.getElementById('goalsEmpty');
    if (!grid) return;

    if (!goals.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = goals.map(g => {
      const pct      = Math.min(100, Math.max(0, g.progress || 0));
      const color    = progressColor(pct);
      const days     = daysUntil(g.deadline);
      const soon     = days !== null && days >= 0 && days <= 7;
      const overdue  = days !== null && days < 0;
      const completed = g.completed || pct >= 100;

      return `
        <div class="goal-card ${completed ? 'completed' : soon ? 'deadline-soon' : ''}" data-id="${g.id}">
          <div class="goal-header">
            <div class="goal-title">${escHtml(g.title)}</div>
            <span class="goal-timeline">${timelineLabels[g.timeline] || g.timeline}</span>
          </div>
          ${g.description ? `<div class="goal-description">${escHtml(g.description)}</div>` : ''}
          <div class="goal-progress">
            <div class="goal-progress-header">
              <span>Progresso</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${color}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="goal-footer">
            <div class="goal-deadline">
              ${g.deadline
                ? `📅 ${formatDate(g.deadline)}
                   ${overdue  ? '<span style="color:var(--danger);font-size:11px;font-weight:600"> · Atrasada</span>' : ''}
                   ${soon && !overdue ? `<span style="color:var(--warning);font-size:11px;font-weight:600"> · ${days}d restantes</span>` : ''}`
                : 'Sem prazo'}
            </div>
            <div class="goal-actions">
              <button class="btn-icon" onclick="Goals.updateProgress('${g.id}')" title="Atualizar progresso">📊</button>
              <button class="btn-icon" onclick="Goals.openEdit('${g.id}')" title="Editar">✏️</button>
              <button class="btn-icon" onclick="Goals.delete('${g.id}')" title="Excluir">🗑️</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- filter ---- */
  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('#goalsFilterBar .filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    render();
  }

  /* ---- add / edit ---- */
  function openAdd() {
    _openModal(null);
  }

  function openEdit(id) {
    const goal = (Storage.get('goals') || []).find(g => g.id === id);
    if (!goal) return;
    _openModal(goal);
  }

  function _openModal(goal) {
    const isEdit = !!goal;
    AtlasApp.openModal(isEdit ? 'Editar Meta' : 'Nova Meta', `
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input type="text" id="goalTitle" class="form-input" placeholder="Qual é sua meta?" value="${isEdit ? escHtml(goal.title) : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="goalDesc" class="form-input" rows="2" placeholder="Descreva sua meta...">${isEdit ? escHtml(goal.description||'') : ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Prazo</label>
          <select id="goalTimeline" class="select-input">
            <option value="short"  ${isEdit && goal.timeline==='short'  ? 'selected':''}>Curto prazo</option>
            <option value="medium" ${!isEdit || goal.timeline==='medium' ? 'selected':''}>Médio prazo</option>
            <option value="long"   ${isEdit && goal.timeline==='long'   ? 'selected':''}>Longo prazo</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Data Limite</label>
          <input type="date" id="goalDeadline" class="form-input" value="${isEdit ? (goal.deadline||'') : ''}">
        </div>
      </div>
      ${isEdit ? `
      <div class="form-group">
        <label class="form-label">Progresso atual: <span id="goalPctDisplay">${goal.progress||0}%</span></label>
        <input type="range" id="goalProgress" min="0" max="100" value="${goal.progress||0}"
          class="form-input" style="padding:4px 0"
          oninput="document.getElementById('goalPctDisplay').textContent=this.value+'%'">
      </div>` : ''}
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: isEdit ? 'Salvar' : 'Criar Meta', class: 'btn-primary', action: () => save(isEdit ? goal.id : null) }
    ]);
    setTimeout(() => { const inp = document.getElementById('goalTitle'); if (inp) inp.focus(); }, 100);
  }

  function save(editId) {
    const title    = (document.getElementById('goalTitle')    ||{}).value?.trim() || '';
    const desc     = (document.getElementById('goalDesc')     ||{}).value?.trim() || '';
    const timeline = (document.getElementById('goalTimeline') ||{}).value || 'medium';
    const deadline = (document.getElementById('goalDeadline') ||{}).value || '';
    const progress = parseInt((document.getElementById('goalProgress') ||{}).value || '0', 10);

    if (!title) { AtlasApp.toast('Informe o título da meta', 'error'); return; }

    const now = new Date().toISOString();
    if (editId) {
      const existing = (Storage.get('goals') || []).find(g => g.id === editId);
      const history  = existing ? (existing.history || []) : [];
      if (existing && progress !== (existing.progress || 0)) {
        history.push({ progress, timestamp: now });
      }
      Storage.update('goals', editId, {
        title, description: desc, timeline, deadline, progress,
        completed: progress >= 100,
        history, updatedAt: now
      });
      AtlasApp.toast('Meta atualizada!', 'success');
      Storage.logActivity('Metas', `"${title}" atualizada`);
    } else {
      Storage.push('goals', {
        id: Storage.uid(), title, description: desc, timeline, deadline,
        progress: 0, completed: false, history: [],
        createdAt: now, updatedAt: now
      });
      AtlasApp.toast('Meta criada!', 'success');
      Storage.logActivity('Metas', `"${title}" criada`);
    }
    AtlasApp.closeModal();
    render();
  }

  /* ---- update progress ---- */
  function updateProgress(id) {
    const goal = (Storage.get('goals') || []).find(g => g.id === id);
    if (!goal) return;
    AtlasApp.openModal('Atualizar Progresso', `
      <p style="margin-bottom:16px">Meta: <strong>${escHtml(goal.title)}</strong></p>
      <div class="form-group">
        <label class="form-label">Progresso: <span id="progDisplay">${goal.progress||0}%</span></label>
        <input type="range" id="progInput" min="0" max="100" value="${goal.progress||0}"
          class="form-input" style="padding:4px 0"
          oninput="document.getElementById('progDisplay').textContent=this.value+'%'">
      </div>
      <div class="progress-bar" style="margin-top:8px">
        <div class="progress-fill primary" id="progPreview" style="width:${goal.progress||0}%"></div>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Salvar', class: 'btn-primary', action: () => {
        const inp = document.getElementById('progInput');
        if (!inp) return;
        const pct = parseInt(inp.value, 10);
        const existing = (Storage.get('goals') || []).find(g => g.id === id);
        const history  = existing ? [...(existing.history || [])] : [];
        history.push({ progress: pct, timestamp: new Date().toISOString() });
        Storage.update('goals', id, {
          progress: pct, completed: pct >= 100, history,
          updatedAt: new Date().toISOString()
        });
        AtlasApp.toast(`Progresso atualizado para ${pct}%`, 'success');
        Storage.logActivity('Metas', `"${goal.title}" — progresso ${pct}%`);
        AtlasApp.closeModal();
        render();
      }}
    ]);
    // live preview
    setTimeout(() => {
      const inp = document.getElementById('progInput');
      const prev = document.getElementById('progPreview');
      if (inp && prev) {
        inp.addEventListener('input', () => { prev.style.width = inp.value + '%'; });
      }
    }, 100);
  }

  /* ---- delete ---- */
  function deleteGoal(id) {
    const goal = (Storage.get('goals') || []).find(g => g.id === id);
    if (!goal) return;
    AtlasApp.openModal('Excluir Meta', `
      <p>Excluir a meta <strong>${escHtml(goal.title)}</strong>? Esta ação não pode ser desfeita.</p>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir', class: 'btn-danger', action: () => {
        Storage.remove('goals', id);
        Storage.logActivity('Metas', `"${goal.title}" excluída`);
        AtlasApp.toast('Meta excluída', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  function setupFilters() {
    const bar = document.getElementById('goalsFilterBar');
    if (!bar) return;
    bar.querySelectorAll('.filter-btn').forEach(b => {
      b.addEventListener('click', () => setFilter(b.dataset.filter));
    });
  }

  function init() {
    setupFilters();
  }

  return { init, render, openAdd, openEdit, updateProgress, delete: deleteGoal, setFilter };
})();
