/* ===== ATLAS AUTH ===== */
const Auth = (() => {
  const TOKEN_KEY = 'atlas_token';
  const REFRESH_KEY = 'atlas_refresh';
  const USER_KEY = 'atlas_user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }
  function isLoggedIn() { return !!getToken(); }

  function saveSession(session, user) {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    if (session.refresh_token) localStorage.setItem(REFRESH_KEY, session.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    API.setToken(session.access_token);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    API.clearToken();
  }

  async function checkSession() {
    const token = getToken();
    if (!token) return false;
    API.setToken(token);
    const res = await API.auth.me();
    if (res.ok && res.data?.user) {
      const user = res.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'usuário';
      const el = document.getElementById('userDisplayName');
      if (el) el.textContent = name;
      return true;
    }
    // Try refresh
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      const r = await API.auth.refresh(refreshToken);
      if (r.ok && r.data?.session) {
        saveSession(r.data.session, r.data.user || getUser());
        return true;
      }
    }
    clearSession();
    return false;
  }

  async function login() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';
    if (!email || !password) { errEl.textContent = 'Preencha todos os campos.'; errEl.style.display = 'block'; return; }
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Entrando…'; btn.disabled = true;
    const res = await API.auth.login(email, password);
    btn.textContent = 'Entrar'; btn.disabled = false;
    if (res.ok && res.data?.session) {
      saveSession(res.data.session, res.data.user);
      await loadAllData();
      document.getElementById('authScreen').classList.remove('visible');
      document.getElementById('loadingScreen').style.display = 'none';
      await AtlasApp.checkVaultSetup();
    } else {
      errEl.textContent = res.data?.error || 'Credenciais inválidas.';
      errEl.style.display = 'block';
    }
  }

  async function register() {
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authRegEmail').value.trim();
    const password = document.getElementById('authRegPassword').value;
    const errEl = document.getElementById('registerError');
    const sucEl = document.getElementById('registerSuccess');
    errEl.style.display = 'none'; sucEl.style.display = 'none';
    if (!email || !password) { errEl.textContent = 'E-mail e senha são obrigatórios.'; errEl.style.display = 'block'; return; }
    if (password.length < 6) { errEl.textContent = 'Senha deve ter mínimo 6 caracteres.'; errEl.style.display = 'block'; return; }
    const btn = document.getElementById('registerBtn');
    btn.textContent = 'Criando…'; btn.disabled = true;
    const res = await API.auth.register(email, password, name);
    btn.textContent = 'Criar conta'; btn.disabled = false;
    if (res.ok) {
      if (res.data?.session) {
        saveSession(res.data.session, res.data.user);
        await loadAllData();
        document.getElementById('authScreen').classList.remove('visible');
        await AtlasApp.checkVaultSetup();
      } else {
        sucEl.textContent = 'Conta criada! Verifique seu e-mail para confirmar.';
        sucEl.style.display = 'block';
      }
    } else {
      errEl.textContent = res.data?.error || 'Erro ao criar conta.';
      errEl.style.display = 'block';
    }
  }

  async function logout() {
    await API.auth.logout().catch(() => {});
    clearSession();
    location.reload();
  }

  async function forgotPassword() {
    const email = prompt('Digite seu e-mail para recuperar a senha:');
    if (!email) return;
    const res = await API.auth.forgotPassword(email);
    AtlasApp.toast(res.ok ? 'E-mail de recuperação enviado!' : (res.data?.error || 'Erro ao enviar.'), res.ok ? 'success' : 'error');
  }

  function toLocal(item) {
    if (!item) return item;
    const r = { ...item };
    if (r.created_at) { r.createdAt = r.created_at; delete r.created_at; }
    if (r.updated_at) { r.updatedAt = r.updated_at; delete r.updated_at; }
    if (r.due_date) { r.dueDate = r.due_date; delete r.due_date; }
    if (r.subject_id) { r.subjectId = r.subject_id; delete r.subject_id; }
    if (r.start_time) { r.startTime = r.start_time; delete r.start_time; }
    if (r.end_time) { r.endTime = r.end_time; delete r.end_time; }
    if (r.end_date) { r.endDate = r.end_date; delete r.end_date; }
    delete r.user_id;
    return r;
  }

  async function loadAllData() {
    try {
      Storage.enableSync(API);
      const [notes, todos, goals, events, diary, links, library] = await Promise.all([
        API.notes.list(), API.todos.list(), API.goals.list(),
        API.events.list(), API.diary.list(), API.links.list(), API.library.list()
      ]);
      if (notes.ok && Array.isArray(notes.data)) Storage.set('notes', notes.data.map(toLocal));
      if (todos.ok && Array.isArray(todos.data)) Storage.set('todos', todos.data.map(toLocal));
      if (goals.ok && Array.isArray(goals.data)) Storage.set('goals', goals.data.map(toLocal));
      if (events.ok && Array.isArray(events.data)) Storage.set('events', events.data.map(toLocal));
      if (diary.ok && Array.isArray(diary.data)) Storage.set('diary', diary.data.map(toLocal));
      if (links.ok && Array.isArray(links.data)) Storage.set('links', links.data.map(toLocal));
      if (library.ok && Array.isArray(library.data)) Storage.set('library', library.data.map(toLocal));

      // Study
      const [subjects, sessions] = await Promise.all([
        API.study.subjects.list(), API.study.sessions.list()
      ]);
      if (subjects.ok && Array.isArray(subjects.data)) Storage.set('study.subjects', subjects.data.map(toLocal));
      if (sessions.ok && Array.isArray(sessions.data)) Storage.set('study.sessions', sessions.data.map(toLocal));

      // Activity
      const actRes = await API.activity.list();
      if (actRes.ok && Array.isArray(actRes.data)) Storage.set('activity', actRes.data.map(toLocal));

    } catch (e) {
      console.warn('loadAllData error:', e);
    }
    Storage.save();
  }

  function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
  }

  function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
  }

  return { getToken, getUser, isLoggedIn, checkSession, saveSession, clearSession, login, register, logout, forgotPassword, loadAllData, showLogin, showRegister, toLocal };
})();
