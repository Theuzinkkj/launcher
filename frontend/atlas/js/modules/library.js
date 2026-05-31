/* ============================================================
   ATLAS HUB — library.js
   Biblioteca pessoal module
   ============================================================ */
const Library = (() => {
  let currentStatus = 'all';
  let typeFilter    = 'all';
  let searchQuery   = '';

  const TYPE_LABELS  = { book:'Livro', course:'Curso', video:'Vídeo', article:'Artigo', podcast:'Podcast' };
  const TYPE_EMOJIS  = { book:'📖', course:'🎓', video:'🎬', article:'📄', podcast:'🎙️' };
  const STATUS_LABELS= { reading:'Lendo', todo:'Quero ver', done:'Concluído' };

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function stars(n) {
    n = Math.max(0, Math.min(5, n || 0));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  /* ---- render ---- */
  function render() {
    let items = Storage.get('library') || [];

    // filter
    if (currentStatus !== 'all') {
      items = items.filter(i => i.status === currentStatus);
    }
    if (typeFilter !== 'all') {
      items = items.filter(i => i.type === typeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i =>
        (i.title  || '').toLowerCase().includes(q) ||
        (i.author || '').toLowerCase().includes(q)
      );
    }

    // update tab active state
    document.querySelectorAll('#libraryTabs .lib-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.status === currentStatus);
    });

    const grid  = document.getElementById('libraryGrid');
    const empty = document.getElementById('libraryEmpty');
    if (!grid) return;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = items.map(item => buildCard(item)).join('');
  }

  function buildCard(item) {
    const emoji  = TYPE_EMOJIS[item.type]  || '📄';
    const tLabel = TYPE_LABELS[item.type]  || item.type;
    const sLabel = STATUS_LABELS[item.status] || item.status;
    const pct    = Math.min(100, Math.max(0, item.progress || 0));

    return `
      <div class="library-card" data-id="${item.id}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:22px">${emoji}</span>
          <div>
            <div class="library-card-type">${escHtml(tLabel)}</div>
          </div>
        </div>
        <div class="library-card-title">${escHtml(item.title)}</div>
        ${item.author ? `<div class="library-card-author">${escHtml(item.author)}</div>` : ''}
        <span class="library-status-badge ${item.status}">${escHtml(sLabel)}</span>
        ${pct > 0 ? `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:3px">
              <span>Progresso</span><span>${pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill primary" style="width:${pct}%"></div>
            </div>
          </div>` : ''}
        ${item.rating ? `<div class="library-rating">${stars(item.rating)}</div>` : ''}
        ${item.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">${escHtml(item.notes.substring(0,80))}${item.notes.length>80?'…':''}</div>` : ''}
        <div class="library-card-footer">
          ${item.url ? `<a class="btn btn-sm btn-outline" href="${escHtml(item.url)}" target="_blank">🔗 Abrir</a>` : '<span></span>'}
          <div style="display:flex;gap:4px">
            <button class="btn-icon" onclick="Library.openEdit('${item.id}')">✏️</button>
            <button class="btn-icon" onclick="Library.delete('${item.id}')">🗑️</button>
          </div>
        </div>
      </div>`;
  }

  /* ---- set status tab ---- */
  function setStatus(status) {
    currentStatus = status;
    render();
  }

  /* ---- add / edit ---- */
  function openAdd() {
    _openModal(null);
  }

  function openEdit(id) {
    const item = (Storage.get('library') || []).find(i => i.id === id);
    if (!item) return;
    _openModal(item);
  }

  function _openModal(item) {
    const isEdit = !!item;
    AtlasApp.openModal(isEdit ? 'Editar Item' : 'Adicionar à Biblioteca', `
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input type="text" id="libTitle" class="form-input" placeholder="Título do livro, curso..."
          value="${isEdit ? escHtml(item.title) : ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Tipo</label>
          <select id="libType" class="select-input">
            ${Object.entries(TYPE_LABELS).map(([v,l]) => `
              <option value="${v}" ${isEdit && item.type===v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="libStatus" class="select-input">
            ${Object.entries(STATUS_LABELS).map(([v,l]) => `
              <option value="${v}" ${isEdit && item.status===v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Autor</label>
          <input type="text" id="libAuthor" class="form-input" placeholder="Autor ou criador"
            value="${isEdit ? escHtml(item.author||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">URL</label>
          <input type="url" id="libUrl" class="form-input" placeholder="https://..."
            value="${isEdit ? escHtml(item.url||'') : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Progresso (0-100)</label>
          <input type="number" id="libProgress" class="form-input" min="0" max="100"
            value="${isEdit ? (item.progress||0) : 0}">
        </div>
        <div class="form-group">
          <label class="form-label">Avaliação (0-5)</label>
          <input type="number" id="libRating" class="form-input" min="0" max="5"
            value="${isEdit ? (item.rating||0) : 0}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea id="libNotes" class="form-input" rows="2" placeholder="Suas anotações...">${isEdit ? escHtml(item.notes||'') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: isEdit ? 'Salvar' : 'Adicionar', class: 'btn-primary', action: () => save(isEdit ? item.id : null) }
    ]);
    setTimeout(() => { const inp = document.getElementById('libTitle'); if (inp) inp.focus(); }, 100);
  }

  function save(editId) {
    const title    = (document.getElementById('libTitle')    ||{}).value?.trim() || '';
    const type     = (document.getElementById('libType')     ||{}).value || 'book';
    const status   = (document.getElementById('libStatus')   ||{}).value || 'todo';
    const author   = (document.getElementById('libAuthor')   ||{}).value?.trim() || '';
    const url      = (document.getElementById('libUrl')      ||{}).value?.trim() || '';
    const progress = Math.max(0, Math.min(100, parseInt((document.getElementById('libProgress')||{}).value||'0', 10)));
    const rating   = Math.max(0, Math.min(5,   parseInt((document.getElementById('libRating')  ||{}).value||'0', 10)));
    const notes    = (document.getElementById('libNotes')    ||{}).value?.trim() || '';

    if (!title) { AtlasApp.toast('Informe o título', 'error'); return; }

    const now = new Date().toISOString();
    if (editId) {
      const old = (Storage.get('library') || []).find(i => i.id === editId);
      const startedAt   = (status === 'reading' && old?.status !== 'reading') ? now : (old?.startedAt || null);
      const completedAt = (status === 'done'    && old?.status !== 'done')    ? now : (old?.completedAt || null);
      Storage.update('library', editId, { title, type, status, author, url, progress, rating, notes, startedAt, completedAt });
      AtlasApp.toast('Item atualizado!', 'success');
      Storage.logActivity('Biblioteca', `"${title}" atualizado`);
    } else {
      Storage.push('library', {
        id: Storage.uid(), title, type, status, author, url, progress, rating, notes,
        startedAt: status === 'reading' ? now : null,
        completedAt: status === 'done'  ? now : null,
        createdAt: now
      });
      AtlasApp.toast('Adicionado à biblioteca!', 'success');
      Storage.logActivity('Biblioteca', `"${title}" adicionado`);
    }
    AtlasApp.closeModal();
    render();
  }

  /* ---- delete ---- */
  function deleteItem(id) {
    const item = (Storage.get('library') || []).find(i => i.id === id);
    if (!item) return;
    AtlasApp.openModal('Excluir Item', `<p>Excluir <strong>${escHtml(item.title)}</strong>?</p>`, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir',  class: 'btn-danger',  action: () => {
        Storage.remove('library', id);
        Storage.logActivity('Biblioteca', `"${item.title}" excluído`);
        AtlasApp.toast('Item excluído', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- search ---- */
  function setupSearch() {
    const inp = document.getElementById('librarySearch');
    if (!inp) return;
    inp.addEventListener('input', () => { searchQuery = inp.value.trim(); render(); });
  }

  function setupTypeFilter() {
    const sel = document.getElementById('libraryTypeFilter');
    if (!sel) return;
    sel.addEventListener('change', () => { typeFilter = sel.value; render(); });
  }

  function setupTabs() {
    const tabs = document.getElementById('libraryTabs');
    if (!tabs) return;
    tabs.querySelectorAll('.lib-tab').forEach(t => {
      t.addEventListener('click', () => setStatus(t.dataset.status));
    });
  }

  /* ---- public API ---- */
  function init() {
    setupSearch();
    setupTypeFilter();
    setupTabs();
  }

  return { init, render, setStatus, openAdd, openEdit, delete: deleteItem };
})();
