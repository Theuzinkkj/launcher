/* ============================================================
   ATLAS HUB — diary.js
   Diário pessoal module
   ============================================================ */
const Diary = (() => {
  let selectedId  = null;
  let searchQuery = '';

  const MOODS = ['😊','😐','😢','😡','😴','🤩','😰','🥳','😌','🤔'];

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(`${y}-${m}-${d}T12:00:00`);
    return dt.toLocaleDateString('pt-BR', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  }

  /* ---- render ---- */
  function render() {
    renderList();
    renderEditor();
  }

  function renderList() {
    const listEl = document.getElementById('diaryList');
    if (!listEl) return;

    let entries = Storage.get('diary') || [];

    // search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        (e.content || '').toLowerCase().includes(q) ||
        (e.date    || '').includes(q)
      );
    }

    // sort desc
    entries.sort((a, b) => b.date.localeCompare(a.date));

    if (!entries.length) {
      listEl.innerHTML = `
        <div class="empty-state" style="padding:32px 16px">
          <div class="empty-state-icon">📖</div>
          <h3>${searchQuery ? 'Nenhum resultado' : 'Nenhuma entrada'}</h3>
          <p>${searchQuery ? 'Tente outra busca.' : 'Comece a escrever seu diário.'}</p>
        </div>`;
      return;
    }

    listEl.innerHTML = entries.map(e => `
      <div class="diary-list-item ${selectedId === e.id ? 'active' : ''}"
           onclick="Diary.select('${e.id}')">
        <div class="diary-item-mood">${e.mood || '📖'}</div>
        <div class="diary-item-info">
          <div class="diary-item-date">${formatDate(e.date)}</div>
          <div class="diary-item-preview">${escHtml((e.content||'').substring(0, 60))}${(e.content||'').length > 60 ? '…' : ''}</div>
        </div>
      </div>`).join('');
  }

  function renderEditor() {
    const editorEl = document.getElementById('diaryEditor');
    if (!editorEl) return;

    if (!selectedId) {
      editorEl.innerHTML = `
        <div class="empty-state" style="padding:60px 24px">
          <div class="empty-state-icon">✍️</div>
          <h3>Selecione uma entrada</h3>
          <p>Escolha uma entrada à esquerda ou crie uma nova.</p>
          <button class="btn btn-primary" onclick="Diary.openAdd()">Nova entrada</button>
        </div>`;
      return;
    }

    const entry = (Storage.get('diary') || []).find(e => e.id === selectedId);
    if (!entry) { selectedId = null; renderEditor(); return; }

    editorEl.innerHTML = `
      <div class="diary-editor">
        <div class="diary-editor-header">
          <div>
            <div class="diary-editor-date">${formatDate(entry.date)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Criado em: ${formatDate(entry.date)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="diary-editor-mood">${entry.mood || '📖'}</span>
            <button class="btn btn-sm btn-outline" onclick="Diary.openEdit('${entry.id}')">✏️ Editar</button>
            <button class="btn btn-sm btn-danger" onclick="Diary.delete('${entry.id}')">🗑</button>
          </div>
        </div>
        <div class="diary-content">${escHtml(entry.content || '')}</div>
      </div>`;
  }

  /* ---- select ---- */
  function select(id) {
    selectedId = id;
    renderList();
    renderEditor();
  }

  /* ---- add / edit ---- */
  function openAdd() {
    _openModal(null);
  }

  function openEdit(id) {
    const entry = (Storage.get('diary') || []).find(e => e.id === id);
    if (!entry) return;
    _openModal(entry);
  }

  function _openModal(entry) {
    const isEdit = !!entry;
    const defaultMood = entry ? entry.mood : '😊';
    AtlasApp.openModal(isEdit ? 'Editar Entrada' : 'Nova Entrada do Diário', `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data *</label>
          <input type="date" id="diaryDate" class="form-input" value="${isEdit ? entry.date : todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Humor</label>
          <div class="mood-picker" id="moodPicker">
            ${MOODS.map(m => `
              <span class="mood-option ${m === defaultMood ? 'selected' : ''}"
                    onclick="Diary._pickMood(this)"
                    data-mood="${m}">${m}</span>`).join('')}
          </div>
          <input type="hidden" id="diaryMood" value="${defaultMood}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Texto *</label>
        <textarea id="diaryContent" class="form-input" rows="8"
          placeholder="Como foi o seu dia?">${isEdit ? escHtml(entry.content||'') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: isEdit ? 'Salvar' : 'Registrar', class: 'btn-primary', action: () => save(isEdit ? entry.id : null) }
    ]);
    setTimeout(() => {
      const ta = document.getElementById('diaryContent');
      if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
    }, 100);
  }

  function _pickMood(el) {
    document.querySelectorAll('#moodPicker .mood-option').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
    const hidden = document.getElementById('diaryMood');
    if (hidden) hidden.value = el.dataset.mood;
  }

  function save(editId) {
    const date    = (document.getElementById('diaryDate')    ||{}).value || '';
    const mood    = (document.getElementById('diaryMood')    ||{}).value || '😊';
    const content = (document.getElementById('diaryContent') ||{}).value?.trim() || '';

    if (!date)    { AtlasApp.toast('Informe a data', 'error'); return; }
    if (!content) { AtlasApp.toast('Escreva algo no diário', 'error'); return; }

    const now = new Date().toISOString();
    if (editId) {
      Storage.update('diary', editId, { date, mood, content, updatedAt: now });
      AtlasApp.toast('Entrada atualizada!', 'success');
      Storage.logActivity('Diário', `Entrada de ${date} atualizada`);
    } else {
      const id = Storage.uid();
      Storage.push('diary', { id, date, mood, content, createdAt: now });
      selectedId = id;
      AtlasApp.toast('Entrada adicionada!', 'success');
      Storage.logActivity('Diário', `Nova entrada em ${date}`);
    }
    AtlasApp.closeModal();
    render();
  }

  /* ---- delete ---- */
  function deleteEntry(id) {
    const entry = (Storage.get('diary') || []).find(e => e.id === id);
    if (!entry) return;
    AtlasApp.openModal('Excluir Entrada', `
      <p>Excluir a entrada de <strong>${formatDate(entry.date)}</strong>?</p>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir',  class: 'btn-danger',  action: () => {
        Storage.remove('diary', id);
        if (selectedId === id) selectedId = null;
        Storage.logActivity('Diário', `Entrada de ${entry.date} excluída`);
        AtlasApp.toast('Entrada excluída', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- search ---- */
  function setupSearch() {
    const inp = document.getElementById('diarySearch');
    if (!inp) return;
    inp.addEventListener('input', () => {
      searchQuery = inp.value.trim();
      renderList();
    });
  }

  /* ---- public API ---- */
  function init() {
    setupSearch();
  }

  return { init, render, select, openAdd, openEdit, delete: deleteEntry, _pickMood };
})();
