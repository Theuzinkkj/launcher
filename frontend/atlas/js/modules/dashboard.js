/* ============================================================
   ATLAS HUB — dashboard.js
   Dashboard module
   ============================================================ */
const Dashboard = (() => {
  let clockInterval = null;

  /* ---- helpers ---- */
  const el = (id) => document.getElementById(id);
  const qs = (sel, ctx = document) => ctx.querySelector(sel);

  function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function startClock() {
    if (clockInterval) clearInterval(clockInterval);
    const tick = () => {
      const now = new Date();
      const clockEl = el('dashClock');
      const dateEl  = el('dashDate');
      const greetEl = el('dashGreeting');
      if (clockEl) clockEl.textContent = formatTime(now);
      if (dateEl)  dateEl.textContent  = formatDate(now);
      if (greetEl) greetEl.textContent = getGreeting() + '! 👋';
    };
    tick();
    clockInterval = setInterval(tick, 1000);
  }

  function formatRelativeTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'agora';
    if (m < 60) return `${m}m atrás`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    return `${d}d atrás`;
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function thisWeekStart() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  /* ---- render events ---- */
  function renderEvents() {
    const container = el('widgetEvents');
    if (!container) return;
    const today = todayStr();
    const events = (Storage.get('events') || []).filter(e => e.date === today);
    if (!events.length) {
      container.innerHTML = '<p class="widget-list-empty">Nenhum evento hoje</p>';
      return;
    }
    container.innerHTML = events.slice(0, 5).map(e => `
      <div class="activity-log-item">
        <span class="activity-dot" style="background:${e.color || 'var(--primary)'}"></span>
        <div style="flex:1">
          <div class="activity-action">${e.title}</div>
          ${e.time ? `<div class="activity-detail">${e.time}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  /* ---- render todos ---- */
  function renderTodos() {
    const container = el('widgetTodos');
    const countEl   = el('widgetTodosCount');
    if (!container) return;
    const todos   = Storage.get('todos') || [];
    const pending = todos.filter(t => !t.done);
    if (countEl) countEl.textContent = pending.length;
    if (!pending.length) {
      container.innerHTML = '<p class="widget-list-empty">Nenhuma tarefa pendente</p>';
      return;
    }
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...pending].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
    container.innerHTML = sorted.slice(0, 5).map(t => {
      const isOverdue = t.dueDate && t.dueDate < todayStr();
      return `
        <div class="activity-log-item" style="cursor:pointer" onclick="AtlasApp.navigate('todos')">
          <span class="priority-badge ${t.priority || 'low'}" style="margin-top:2px">${t.priority || 'low'}</span>
          <div style="flex:1">
            <div class="activity-action">${t.title}</div>
            ${t.dueDate ? `<div class="activity-detail ${isOverdue ? 'todo-due overdue' : ''}">${isOverdue ? '⚠ Atrasada' : t.dueDate}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  /* ---- render goals ---- */
  function renderGoals() {
    const container = el('widgetGoals');
    if (!container) return;
    const goals = (Storage.get('goals') || []).filter(g => !g.completed);
    if (!goals.length) {
      container.innerHTML = '<p class="widget-list-empty">Nenhuma meta ativa</p>';
      return;
    }
    container.innerHTML = goals.slice(0, 4).map(g => {
      const pct = Math.min(100, Math.max(0, g.progress || 0));
      const color = pct >= 75 ? 'green' : pct >= 40 ? 'yellow' : 'red';
      return `
        <div style="margin-bottom:10px; cursor:pointer" onclick="AtlasApp.navigate('goals')">
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
            <span style="font-weight:500;color:var(--text)">${g.title}</span>
            <span style="color:var(--text-muted)">${pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${color}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- render study ---- */
  function renderStudy() {
    const container  = el('widgetStudy');
    const hoursEl    = el('dashStudyHours');
    if (!container) return;
    const sessions = Storage.get('study.sessions') || [];
    const weekStart = thisWeekStart();
    const weekSessions = sessions.filter(s => new Date(s.createdAt) >= weekStart);
    const totalMins = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const hours = (totalMins / 60).toFixed(1);
    if (hoursEl) hoursEl.textContent = hours + 'h';
    const subjects = Storage.get('study.subjects') || [];
    if (!subjects.length) {
      container.innerHTML = '<p class="widget-list-empty">Nenhuma matéria cadastrada</p>';
      return;
    }
    container.innerHTML = subjects.slice(0, 4).map(sub => {
      const subSessions = sessions.filter(s => s.subjectId === sub.id);
      const subMins = subSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
      return `
        <div class="activity-log-item" style="cursor:pointer" onclick="AtlasApp.navigate('study')">
          <span style="width:10px;height:10px;border-radius:50%;background:${sub.color || 'var(--primary)'};display:inline-block;margin-top:4px;flex-shrink:0"></span>
          <div style="flex:1">
            <div class="activity-action">${sub.name}</div>
            <div class="activity-detail">${(subMins/60).toFixed(1)}h total</div>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- render mood ---- */
  function renderMood() {
    const container = el('widgetMood');
    if (!container) return;
    const diary = Storage.get('diary') || [];
    const days  = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    container.innerHTML = days.map(day => {
      const entry = diary.find(d => d.date === day);
      const emoji = entry ? entry.mood : '⬜';
      const label = new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
      return `<div class="mood-day"><span class="mood-emoji">${emoji}</span><span>${label}</span></div>`;
    }).join('');
  }

  /* ---- render activity ---- */
  function renderActivity() {
    const container = el('widgetActivity');
    if (!container) return;
    const activity = Storage.get('activity') || [];
    if (!activity.length) {
      container.innerHTML = '<p class="widget-list-empty">Nenhuma atividade ainda</p>';
      return;
    }
    container.innerHTML = [...activity].reverse().slice(0, 10).map(a => `
      <div class="activity-log-item">
        <span class="activity-dot"></span>
        <div style="flex:1">
          <span class="activity-action">${a.action}</span>
          ${a.detail ? `<span class="activity-detail"> — ${a.detail}</span>` : ''}
        </div>
        <span class="activity-time">${formatRelativeTime(a.time)}</span>
      </div>`).join('');
  }

  /* ---- setup widget navigation links ---- */
  function setupNavLinks() {
    document.querySelectorAll('[data-section]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const section = el.dataset.section;
        if (section && typeof AtlasApp !== 'undefined') {
          AtlasApp.navigate(section);
        }
      });
    });
  }

  /* ---- public API ---- */
  function init() {
    startClock();
    setupNavLinks();
  }

  function render() {
    renderEvents();
    renderTodos();
    renderGoals();
    renderStudy();
    renderMood();
    renderActivity();
  }

  function destroy() {
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  }

  return { init, render, destroy };
})();
