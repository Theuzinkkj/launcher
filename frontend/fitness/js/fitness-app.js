/* ===== FITHUB APP SHELL ===== */

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
      return { ok: false, error: 'Sem conexão' };
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
  let _current = 'dashboard';
  let _modules = {};
  const TITLES = {
    dashboard: 'Dashboard', workouts: 'Treinos', nutrition: 'Alimentação',
    progress: 'Progresso', fitbot: 'FitBot IA', profile: 'Meu Perfil'
  };

  async function init() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { window.location.href = '/'; return; }

    const r = await FitnessAPI.get('/api/auth/me');
    if (!r.ok) { window.location.href = '/'; return; }

    const theme = localStorage.getItem('atlas_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    const user = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } })();
    const el = document.getElementById('userNameDisplay');
    if (el && user) el.textContent = user.name || user.email;

    const hour = new Date().getHours();
    const gr = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const grEl = document.getElementById('dashGreeting');
    if (grEl) grEl.textContent = `${gr}${user?.name ? ', ' + user.name.split(' ')[0] : ''}! 💪`;
    const dEl = document.getElementById('dashDate');
    if (dEl) dEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');

    _modules = { dashboard: Dashboard, workouts: Workouts, nutrition: Nutrition, progress: Progress, fitbot: FitBot, profile: Profile };

    document.querySelectorAll('.nav-item[data-section]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.section); if (window.innerWidth <= 768) closeSidebar(); });
    });

    Object.values(_modules).forEach(m => { try { m.init?.(); } catch(e) { console.warn(e); } });

    const last = sessionStorage.getItem('fitness_section') || 'dashboard';
    navigate(last);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  function navigate(section) {
    if (!TITLES[section]) section = 'dashboard';
    _current = section;
    sessionStorage.setItem('fitness_section', section);

    document.querySelectorAll('.section').forEach(s => {
      const active = s.id === `sec-${section}`;
      s.classList.toggle('active', active);
      s.classList.toggle('hidden', !active);
    });
    document.querySelectorAll('.nav-item[data-section]').forEach(el => el.classList.toggle('active', el.dataset.section === section));
    const t = document.getElementById('topbarTitle');
    if (t) t.textContent = TITLES[section];
    const mod = _modules[section];
    if (mod?.render) { try { mod.render(); } catch(e) { console.warn(e); } }
  }

  function toggleSidebar() { if (window.innerWidth <= 768) document.getElementById('sidebar').classList.toggle('open'); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('atlas_theme', next);
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

  function toast(message, type = 'info', duration = 3500) {
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

  return { navigate, toggleSidebar, closeSidebar, toggleTheme, openModal, closeModal, toast, today, fmtDate };
})();
