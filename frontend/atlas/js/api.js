/* ===== ATLAS API CLIENT ===== */
const API = (() => {
  const BASE = window.location.origin + '/api';
  const OFFLINE_KEY = 'atlas_offline_queue';
  let _token = localStorage.getItem('atlas_token');

  // ── Core helpers ────────────────────────────────────────────────────────────
  function setToken(t) { _token = t; }
  function clearToken() { _token = null; }
  function getToken() { return _token; }
  function isOnline() { return navigator.onLine; }

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    if (_token) h['Authorization'] = 'Bearer ' + _token;
    return h;
  }

  async function request(method, path, body) {
    const url = path.startsWith('/api/') ? window.location.origin + path : BASE + path;
    try {
      const opts = { method, headers: headers() };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      let data;
      try { data = await res.json(); } catch { data = {}; }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      // Offline: queue mutation requests
      if (!isOnline() && ['POST','PUT','PATCH','DELETE'].includes(method)) {
        enqueueOffline(method, path, body);
      }
      return { ok: false, status: 0, data: { error: e.message } };
    }
  }

  const get = (path) => request('GET', path);
  const post = (path, body) => request('POST', path, body);
  const put = (path, body) => request('PUT', path, body);
  const del = (path) => request('DELETE', path);

  // ── Offline queue ────────────────────────────────────────────────────────────
  function enqueueOffline(method, path, body) {
    const q = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    q.push({ method, path, body, ts: Date.now() });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
  }

  async function flushOfflineQueue() {
    const q = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    if (!q.length) return;
    const remaining = [];
    for (const item of q) {
      const res = await request(item.method, item.path, item.body);
      if (!res.ok) remaining.push(item);
    }
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
  }

  // Flush when coming back online
  window.addEventListener('online', flushOfflineQueue);

  // ── Resource factory ─────────────────────────────────────────────────────────
  function resource(path) {
    return {
      list: () => get(path),
      create: (d) => post(path, d),
      update: (id, d) => put(path + '/' + id, d),
      remove: (id) => del(path + '/' + id),
    };
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const auth = {
    login: (email, password) => post('/auth/login', { email, password }),
    register: (email, password, name) => post('/auth/register', { email, password, name }),
    logout: () => post('/auth/logout', {}),
    me: () => get('/auth/me'),
    refresh: (refresh_token) => post('/auth/refresh', { refresh_token }),
    forgotPassword: (email) => post('/auth/forgot-password', { email }),
  };

  // ── Resources ─────────────────────────────────────────────────────────────────
  const notes = resource('/notes');
  const todos = resource('/todos');
  const goals = resource('/goals');
  const events = resource('/events');
  const diary = resource('/diary');
  const links = resource('/links');
  const library = resource('/library');
  const vault = resource('/vault');

  const study = {
    subjects: resource('/study/subjects'),
    sessions: resource('/study/sessions'),
  };

  const activity = {
    list: () => get('/activity'),
    create: (d) => post('/activity', d),
  };

  const settings = {
    get: () => get('/settings'),
    update: (d) => put('/settings', d),
  };

  const files = {
    list: (folderId) => get('/files' + (folderId ? '?folder=' + folderId : '')),
    upload: (formData) => {
      const h = {};
      if (_token) h['Authorization'] = 'Bearer ' + _token;
      return fetch(BASE + '/files/upload', { method: 'POST', headers: h, body: formData })
        .then(r => r.json().then(d => ({ ok: r.ok, data: d })));
    },
    remove: (id) => del('/files/' + id),
    createFolder: (d) => post('/files/folders', d),
  };

  const exportApi = {
    all: () => get('/export/all'),
  };

  return {
    setToken, clearToken, getToken, isOnline,
    auth, notes, todos, goals, events, diary, links, library,
    vault, study, activity, settings, files,
    export: exportApi,
    flushOfflineQueue,
    get, post, put, del,
  };
})();
