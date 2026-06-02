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

  function getRecoverySession() {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(window.location.search);
    return {
      accessToken: hashParams.get('access_token') || queryParams.get('access_token') || '',
      refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token') || ''
    };
  }

  function isResetPasswordUrl() {
    return window.location.pathname.includes('/reset-password') || !!getRecoverySession().accessToken;
  }

  function showResetPassword() {
    const session = getRecoverySession();
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('authScreen').classList.add('visible');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));

    const errEl = document.getElementById('resetPasswordError');
    const sucEl = document.getElementById('resetPasswordSuccess');
    errEl.style.display = 'none';
    sucEl.style.display = 'none';
    if (!session.accessToken || !session.refreshToken) {
      errEl.textContent = 'Link de recuperacao invalido ou expirado. Solicite um novo e-mail.';
      errEl.style.display = 'block';
    }
    return true;
  }

  async function resetPassword() {
    const session = getRecoverySession();
    const password = document.getElementById('resetPassword').value;
    const confirm = document.getElementById('resetPasswordConfirm').value;
    const errEl = document.getElementById('resetPasswordError');
    const sucEl = document.getElementById('resetPasswordSuccess');
    errEl.style.display = 'none';
    sucEl.style.display = 'none';

    if (!session.accessToken || !session.refreshToken) { errEl.textContent = 'Link de recuperacao invalido ou expirado.'; errEl.style.display = 'block'; return; }
    if (!password || password.length < 6) { errEl.textContent = 'A nova senha deve ter pelo menos 6 caracteres.'; errEl.style.display = 'block'; return; }
    if (password !== confirm) { errEl.textContent = 'As senhas nao conferem.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('resetPasswordBtn');
    btn.textContent = 'Alterando...'; btn.disabled = true;
    const res = await API.auth.resetPassword(session.accessToken, session.refreshToken, password);
    btn.textContent = 'Alterar senha'; btn.disabled = false;

    if (res.ok) {
      clearSession();
      sucEl.textContent = 'Senha alterada com sucesso. Entre usando a nova senha.';
      sucEl.style.display = 'block';
      history.replaceState(null, '', '/atlas');
      setTimeout(showLogin, 1800);
    } else {
      errEl.textContent = res.data?.error || 'Nao foi possivel alterar a senha.';
      errEl.style.display = 'block';
    }
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

  function forgotPassword() {
    const currentEmail = document.getElementById('authEmail')?.value.trim() || '';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.getElementById('forgotPasswordForm').style.display = 'block';
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));

    const emailEl = document.getElementById('forgotPasswordEmail');
    const errEl = document.getElementById('forgotPasswordError');
    const sucEl = document.getElementById('forgotPasswordSuccess');
    if (emailEl) {
      emailEl.value = currentEmail;
      setTimeout(() => emailEl.focus(), 0);
    }
    errEl.style.display = 'none';
    sucEl.style.display = 'none';
  }

  async function sendPasswordReset() {
    const email = document.getElementById('forgotPasswordEmail').value.trim();
    const errEl = document.getElementById('forgotPasswordError');
    const sucEl = document.getElementById('forgotPasswordSuccess');
    errEl.style.display = 'none';
    sucEl.style.display = 'none';
    if (!email) { errEl.textContent = 'Informe seu e-mail.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('forgotPasswordBtn');
    btn.textContent = 'Enviando...'; btn.disabled = true;
    const res = await API.auth.forgotPassword(email);
    btn.textContent = 'Enviar link de redefinicao'; btn.disabled = false;

    if (res.ok) {
      sucEl.textContent = 'Enviamos um link de redefinicao para seu e-mail.';
      sucEl.style.display = 'block';
    } else {
      errEl.textContent = res.data?.error || 'Nao foi possivel enviar o e-mail.';
      errEl.style.display = 'block';
    }
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
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
  }

  function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('forgotPasswordForm').style.display = 'none';
    document.getElementById('resetPasswordForm').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
  }

  return { getToken, getUser, isLoggedIn, checkSession, saveSession, clearSession, login, register, logout, forgotPassword, sendPasswordReset, resetPassword, isResetPasswordUrl, showResetPassword, loadAllData, showLogin, showRegister, toLocal };
})();
