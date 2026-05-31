/* ===== ATLAS STORAGE — LocalStorage Manager + Supabase Sync ===== */
const Storage = (() => {
  const VERSION = '1.0.0';
  const KEY = 'atlas_data';
  let _data = null;
  let _saveTimer = null;
  let _api = null;

  const SYNC_MAP = {
    notes: api => api.notes,
    todos: api => api.todos,
    goals: api => api.goals,
    events: api => api.events,
    diary: api => api.diary,
    links: api => api.links,
    library: api => api.library,
  };

  function enableSync(api) { _api = api; }

  const DEFAULT = {
    version: VERSION,
    settings: { theme: 'light', notifications: false },
    vault: { masterHash: null, salt: null, entries: [] },
    notes: [], todos: [], goals: [], events: [], diary: [],
    study: { subjects: [], sessions: [] },
    links: [], library: [], activity: [],
    pomodoroStats: [],
    pomodoroSettings: { work: 25, shortBreak: 5, longBreak: 15, cycles: 4 },
    tags: []
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { _data = deepClone(DEFAULT); return; }
      _data = deepMerge(deepClone(DEFAULT), JSON.parse(raw));
    } catch { _data = deepClone(DEFAULT); }
  }

  function save() {
    if (!_data) return;
    try { localStorage.setItem(KEY, JSON.stringify(_data)); } catch {}
  }

  function scheduleSave() { clearTimeout(_saveTimer); _saveTimer = setTimeout(save, 300); }

  function get(path) {
    if (!_data) load();
    if (!path) return _data;
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), _data);
  }

  function set(path, value) {
    if (!_data) load();
    const parts = path.split('.');
    let obj = _data;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] == null) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    scheduleSave();
  }

  function push(path, item) {
    const arr = get(path) || [];
    arr.push(item);
    set(path, arr);
    if (_api && SYNC_MAP[path]) {
      SYNC_MAP[path](_api).create(item).then(result => {
        if (result.ok && result.data?.id) {
          const items = get(path) || [];
          const idx = items.findIndex(x => x.id === item.id);
          if (idx >= 0 && items[idx].id !== result.data.id) {
            items[idx] = { ...items[idx], id: result.data.id };
            set(path, items);
          }
        }
      }).catch(() => {});
    }
    return item;
  }

  function update(path, id, updates) {
    const arr = get(path) || [];
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() };
    set(path, arr);
    if (_api && SYNC_MAP[path]) SYNC_MAP[path](_api).update(id, updates).catch(() => {});
    return arr[idx];
  }

  function remove(path, id) {
    const arr = get(path) || [];
    set(path, arr.filter(x => x.id !== id));
    if (_api && SYNC_MAP[path]) SYNC_MAP[path](_api).remove(id).catch(() => {});
  }

  function exportAll() { save(); return JSON.stringify(_data, null, 2); }

  function importAll(jsonStr) {
    try { _data = deepMerge(deepClone(DEFAULT), JSON.parse(jsonStr)); save(); return true; } catch { return false; }
  }

  function clearAll() { _data = deepClone(DEFAULT); save(); }

  function logActivity(action, detail) {
    const activity = get('activity') || [];
    activity.unshift({ id: uid(), action, detail, time: new Date().toISOString() });
    set('activity', activity.slice(0, 100));
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        deepMerge(target[key], source[key]);
      } else { target[key] = source[key]; }
    }
    return target;
  }

  load();
  return { get, set, push, update, remove, exportAll, importAll, clearAll, logActivity, uid, save, enableSync };
})();
