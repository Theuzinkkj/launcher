/* ===== ATLASFIT APP SHELL ===== */

const TOKEN_KEY = 'atlas_token';
const USER_KEY  = 'atlas_user';

const FitnessAPI = (() => {
  function getToken() { return localStorage.getItem(TOKEN_KEY); }

  async function request(method, path, body = null) {
    const token = getToken();
    const base = path.startsWith('/api/') ? window.location.origin : window.location.origin + '/api/fitness';
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    try {
      const res = await fetch(base + path, opts);
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data, error: data.error };
    } catch {
      return { ok: false, error: 'Sem conexao' };
    }
  }

  return {
    getToken,
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    del: (p) => request('DELETE', p)
  };
})();

const FitnessApp = (() => {
  let _current = 'habits';
  let _trainingPanel = 'workouts';
  let _modules = {};
  const TITLES = {
    habits: 'Hábitos',
    tasks: 'Tarefas',
    workouts: 'Treinos',
    goals: 'Metas',
    profile: 'Perfil'
  };

  async function init() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { window.location.href = '/'; return; }

    const r = await FitnessAPI.get('/api/auth/me');
    if (!r.ok) { window.location.href = '/'; return; }

    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('atlas_theme', 'dark');

    const user = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } })();
    const el = document.getElementById('userNameDisplay');
    if (el && user) el.textContent = user.name || user.email?.split('@')[0] || 'atleta';

    const dEl = document.getElementById('dashDate');
    if (dEl) dEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    _modules = {
      habits: Habits,
      tasks: FitTasks,
      workouts: Workouts,
      goals: FitGoals,
      profile: Profile
    };

    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.section);
      });
    });

    Object.values(_modules).forEach(m => { try { m.init?.(); } catch(e) { console.warn(e); } });
    Nutrition.init?.();

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');

    const hash = location.hash.replace('#', '');
    const last = hash && TITLES[hash] ? hash : sessionStorage.getItem('fitness_section') || 'habits';
    navigate(last);
    updateStreak();

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function navigate(section) {
    if (!TITLES[section]) section = 'habits';
    _current = section;
    sessionStorage.setItem('fitness_section', section);
    if (location.hash.replace('#', '') !== section) location.hash = section;

    document.querySelectorAll('.section').forEach(s => {
      const active = s.id === `sec-${section}`;
      s.classList.toggle('active', active);
      s.classList.toggle('hidden', !active);
    });
    document.querySelectorAll('[data-section]').forEach(el => el.classList.toggle('active', el.dataset.section === section));
    const t = document.getElementById('topbarTitle');
    if (t) t.textContent = TITLES[section];
    const mod = _modules[section];
    if (mod?.render) { try { mod.render(); } catch(e) { console.warn(e); } }
    if (section === 'workouts') renderTrainingPanel();
  }

  function setTrainingPanel(panel) {
    _trainingPanel = panel === 'diet' ? 'diet' : 'workouts';
    renderTrainingPanel();
  }

  function renderTrainingPanel() {
    document.querySelectorAll('.segmented [data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === _trainingPanel));
    document.getElementById('trainingPanelWorkouts')?.classList.toggle('hidden', _trainingPanel !== 'workouts');
    document.getElementById('trainingPanelDiet')?.classList.toggle('hidden', _trainingPanel !== 'diet');
    if (_trainingPanel === 'diet') Nutrition.render?.();
    else Workouts.render?.();
  }

  function updateStreak() {
    const count = Habits?.getBestStreak?.() || 0;
    const el = document.getElementById('streakCount');
    if (el) el.textContent = count;
  }

  function toggleTheme() {
    document.documentElement.setAttribute('data-theme', 'dark');
    toast('AtlasFit usa tema escuro por padrao.', 'info');
  }

  function openModal(title, body, buttons = []) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = buttons.map(b =>
      `<button class="btn ${b.primary ? 'btn-fit' : 'btn-ghost'}" onclick="${b.action}">${b.label}</button>`
    ).join('');
    document.getElementById('modalOverlay').classList.remove('hidden');
    setTimeout(() => {
      const inp = document.querySelector('#modalBody input:not([type=hidden]):not([type=checkbox]),#modalBody select,#modalBody textarea');
      if (inp) inp.focus();
    }, 60);
  }

  function closeModal(event) {
    if (event && event.target !== document.getElementById('modalOverlay')) return;
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
    document.getElementById('modalFooter').innerHTML = '';
  }

  function toast(message, type = 'info', duration = 3200) {
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    el.onclick = () => el.remove();
    c.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function today() { return new Date().toISOString().split('T')[0]; }
  function fmtDate(d) { return d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : ''; }

  document.addEventListener('DOMContentLoaded', init);

  return { navigate, setTrainingPanel, renderTrainingPanel, updateStreak, toggleTheme, openModal, closeModal, toast, today, fmtDate };
})();
