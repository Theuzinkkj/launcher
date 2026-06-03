/* ===== ATLASFIT HABITS ===== */

const Habits = (() => {
  const KEY = 'atlasfit_habits';
  let _view = 'today';

  const DEFAULTS = [
    { id: uid(), name: 'Treinar', icon: 'B', period: 'TARDE', createdAt: now(), checks: {} },
    { id: uid(), name: 'Dieta no plano', icon: 'D', period: 'NOITE', createdAt: now(), checks: {} },
    { id: uid(), name: '3L de agua', icon: 'A', period: 'DIA', createdAt: now(), checks: {} }
  ];

  function init() {
    if (!localStorage.getItem(KEY)) save(DEFAULTS);
  }

  function render() {
    const wrap = document.getElementById('habitsContent');
    if (!wrap) return;
    const habits = get();
    const today = FitnessApp.today();
    const completed = habits.filter(h => h.checks?.[today]).length;
    const pct = habits.length ? Math.round(completed / habits.length * 100) : 0;

    wrap.innerHTML = `
      <div class="hero-card">
        <div>
          <span class="card-kicker">Dia vencido.</span>
          <h3>${completed}/${habits.length} concluidos</h3>
          <p>"Vai desistir e chamar isso de saude mental?"</p>
        </div>
        <div class="hero-score">${pct}%</div>
      </div>
      <div class="segmented">
        <button class="${_view === 'today' ? 'active' : ''}" onclick="Habits.setView('today')">Hoje</button>
        <button class="${_view === 'week' ? 'active' : ''}" onclick="Habits.setView('week')">Semana</button>
      </div>
      ${_view === 'week' ? renderWeek(habits) : renderToday(habits)}
      <div class="reward-card">
        <strong>Proxima medalha: RELENTLESS</strong>
        <span>Faltam ${Math.max(0, 30 - getBestStreak())} dias</span>
        <div class="progress-line"><i style="width:${Math.min(100, getBestStreak() / 30 * 100)}%"></i></div>
      </div>`;
  }

  function renderToday(habits) {
    const today = FitnessApp.today();
    return `<div class="card-list">${habits.map(h => `
      <label class="check-card ${h.checks?.[today] ? 'done' : ''}">
        <input type="checkbox" ${h.checks?.[today] ? 'checked' : ''} onchange="Habits.toggle('${h.id}')">
        <span class="fake-check">${h.checks?.[today] ? '✓' : ''}</span>
        <span class="habit-icon">${esc(h.icon || 'H')}</span>
        <span><strong>${esc(h.name)}</strong><small>${esc(h.period || 'DIA')} · streak ${streakFor(h)} dias</small></span>
      </label>`).join('')}</div>`;
  }

  function renderWeek(habits) {
    const days = lastDays(7);
    return `<div class="week-grid">${habits.map(h => `
      <div class="week-card">
        <div><strong>${esc(h.name)}</strong><small>${streakFor(h)} dias de sequencia</small></div>
        <div class="week-dots">${days.map(d => `<button class="${h.checks?.[d] ? 'hit' : ''}" onclick="Habits.toggle('${h.id}','${d}')">${new Date(d + 'T00:00:00').getDate()}</button>`).join('')}</div>
      </div>`).join('')}</div>`;
  }

  function openAdd() {
    FitnessApp.openModal('Novo habito', `
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Nome</label><input id="habitName" class="form-input" placeholder="Ex: Cardio 20min"></div>
        <div class="form-group"><label class="form-label">Icone curto</label><input id="habitIcon" class="form-input" maxlength="2" placeholder="C"></div>
      </div>
      <div class="form-group"><label class="form-label">Periodo</label><select id="habitPeriod" class="form-input"><option>DIA</option><option>MANHA</option><option>TARDE</option><option>NOITE</option></select></div>`,
      [{ label: 'Cancelar', action: 'FitnessApp.closeModal()' }, { label: 'Salvar', action: 'Habits.saveHabit()', primary: true }]
    );
  }

  function saveHabit() {
    const name = document.getElementById('habitName')?.value.trim();
    if (!name) { FitnessApp.toast('Digite o nome do habito.', 'error'); return; }
    const habits = get();
    habits.unshift({ id: uid(), name, icon: document.getElementById('habitIcon')?.value.trim() || name[0], period: document.getElementById('habitPeriod')?.value || 'DIA', createdAt: now(), checks: {} });
    save(habits);
    FitnessApp.closeModal();
    render();
  }

  function toggle(id, date = FitnessApp.today()) {
    const habits = get();
    const h = habits.find(x => x.id === id);
    if (!h) return;
    h.checks = h.checks || {};
    h.checks[date] ? delete h.checks[date] : h.checks[date] = true;
    save(habits);
    render();
    FitnessApp.updateStreak();
  }

  function setView(view) { _view = view === 'week' ? 'week' : 'today'; render(); }
  function getBestStreak() { return Math.max(0, ...get().map(streakFor)); }
  function streakFor(h) {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (h.checks?.[d.toISOString().split('T')[0]]) count++;
      else break;
    }
    return count;
  }

  function get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function lastDays(n) { return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return d.toISOString().split('T')[0]; }); }
  function uid() { return 'h_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function now() { return new Date().toISOString(); }
  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }

  return { init, render, openAdd, saveHabit, toggle, setView, getBestStreak };
})();
