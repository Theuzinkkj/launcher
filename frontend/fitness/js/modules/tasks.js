/* ===== ATLASFIT TASKS ===== */

const FitTasks = (() => {
  const KEY = 'atlasfit_tasks';
  let _view = 'today';

  function init() {
    if (!localStorage.getItem(KEY)) save([
      { id: uid(), title: 'Organizar mesa', due: FitnessApp.today(), done: false, createdAt: now() },
      { id: uid(), title: 'Revisar anotacoes', due: FitnessApp.today(), done: false, createdAt: now() }
    ]);
  }

  function render() {
    const wrap = document.getElementById('tasksContent');
    if (!wrap) return;
    const tasks = get();
    const filtered = _view === 'today' ? tasks.filter(t => t.due === FitnessApp.today()) : tasks;
    const pending = filtered.filter(t => !t.done).length;
    wrap.innerHTML = `
      <div class="hero-card">
        <div><span class="card-kicker">Com prazo. Nao contam no streak.</span><h3>${pending} pendentes</h3><p>Execute o que foi prometido.</p></div>
        <div class="hero-score">${filtered.length - pending}/${filtered.length}</div>
      </div>
      <div class="segmented">
        <button class="${_view === 'today' ? 'active' : ''}" onclick="FitTasks.setView('today')">Hoje</button>
        <button class="${_view === 'week' ? 'active' : ''}" onclick="FitTasks.setView('week')">Semana</button>
      </div>
      <div class="card-list">${filtered.map(t => `
        <label class="check-card ${t.done ? 'done' : ''}">
          <input type="checkbox" ${t.done ? 'checked' : ''} onchange="FitTasks.toggle('${t.id}')">
          <span class="fake-check">${t.done ? '✓' : ''}</span>
          <span><strong>${esc(t.title)}</strong><small>${FitnessApp.fmtDate(t.due)}</small></span>
          <button class="icon-btn" type="button" onclick="FitTasks.remove('${t.id}')">x</button>
        </label>`).join('') || '<div class="empty-state"><h3>Nada por agora</h3><p>Crie uma tarefa para o dia.</p></div>'}</div>`;
  }

  function openAdd() {
    FitnessApp.openModal('Nova tarefa', `
      <div class="form-group"><label class="form-label">Tarefa</label><input id="taskTitle" class="form-input" placeholder="Ex: Comprar creatina"></div>
      <div class="form-group"><label class="form-label">Prazo</label><input type="date" id="taskDue" class="form-input" value="${FitnessApp.today()}"></div>`,
      [{ label: 'Cancelar', action: 'FitnessApp.closeModal()' }, { label: 'Salvar', action: 'FitTasks.saveTask()', primary: true }]
    );
  }

  function saveTask() {
    const title = document.getElementById('taskTitle')?.value.trim();
    if (!title) { FitnessApp.toast('Digite a tarefa.', 'error'); return; }
    const tasks = get();
    tasks.unshift({ id: uid(), title, due: document.getElementById('taskDue')?.value || FitnessApp.today(), done: false, createdAt: now() });
    save(tasks);
    FitnessApp.closeModal();
    render();
  }

  function toggle(id) {
    const tasks = get();
    const t = tasks.find(x => x.id === id);
    if (t) t.done = !t.done;
    save(tasks);
    render();
  }

  function remove(id) { save(get().filter(t => t.id !== id)); render(); }
  function setView(view) { _view = view === 'week' ? 'week' : 'today'; render(); }
  function get() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
  function save(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function uid() { return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function now() { return new Date().toISOString(); }
  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }

  return { init, render, openAdd, saveTask, toggle, remove, setView };
})();
