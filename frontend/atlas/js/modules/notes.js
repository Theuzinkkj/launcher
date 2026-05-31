/* ===== NOTES MODULE ===== */

const Notes = (() => {
  function init() { render(); }

  function render() {
    const q = (document.getElementById('notesSearch')?.value || '').toLowerCase();
    const catFilter = document.getElementById('notesCategoryFilter')?.value || '';
    let notes = Storage.get('notes') || [];

    if (q) notes = notes.filter(n => n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q));
    if (catFilter) notes = notes.filter(n => n.category === catFilter);

    const pinned = notes.filter(n => n.pinned);
    const rest = notes.filter(n => !n.pinned);

    const pinnedSec = document.getElementById('notesPinned');
    const pinnedGrid = document.getElementById('notesPinnedGrid');
    if (pinned.length > 0) {
      pinnedSec?.classList.remove('hidden');
      if (pinnedGrid) pinnedGrid.innerHTML = pinned.map(buildCard).join('');
    } else {
      pinnedSec?.classList.add('hidden');
    }

    const grid = document.getElementById('notesGrid');
    const empty = document.getElementById('notesEmpty');
    const subtitle = document.getElementById('notesSubtitle');
    const allNotes = Storage.get('notes') || [];
    if (subtitle) subtitle.textContent = `${allNotes.length} nota${allNotes.length !== 1 ? 's' : ''}`;
    if (grid) grid.innerHTML = rest.map(buildCard).join('');
    empty?.classList.toggle('hidden', rest.length > 0 || pinned.length > 0);

    updateCategoryFilter();
    updateNavCount();
  }

  function buildCard(note) {
    const date = new Date(note.updatedAt || note.updated_at || note.createdAt || note.created_at).toLocaleDateString('pt-BR');
    return `
      <div class="note-card ${note.pinned ? 'pinned' : ''}" onclick="Notes.openView('${note.id}')">
        <div class="note-actions">
          <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();Notes.togglePin('${note.id}')" title="${note.pinned ? 'Desafixar' : 'Fixar'}">${note.pinned ? '📌' : '📍'}</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();Notes.openEdit('${note.id}')">✏️</button>
          <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();Notes.deleteNote('${note.id}')">🗑️</button>
        </div>
        ${note.category ? `<span class="note-category">${esc(note.category)}</span>` : ''}
        <h4 class="note-title">${esc(note.title || 'Sem título')}</h4>
        <p class="note-preview">${esc((note.content || '').slice(0, 120))}</p>
        <div class="note-footer">
          <span>${date}</span>
          ${note.tags?.length ? `<span style="font-size:.7rem;color:var(--text-muted)">${note.tags.slice(0, 3).map(t => '#' + t).join(' ')}</span>` : ''}
        </div>
      </div>`;
  }

  function openAdd() { openEdit(null); }

  function openEdit(id) {
    const note = id ? (Storage.get('notes') || []).find(n => n.id === id) : null;
    const cats = getCategories();
    const catOpts = cats.map(c => `<option value="${esc(c)}" ${note?.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    AtlasApp.openModal(note ? 'Editar Nota' : 'Nova Nota', `
      <input type="text" id="noteTitle" class="form-input" placeholder="Título da nota…" value="${esc(note?.title || '')}" style="font-size:1.1rem;font-weight:600;margin-bottom:.75rem" />
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.875rem">
        <select id="noteCategory" class="select-input" style="width:auto">
          <option value="">Sem categoria</option>
          ${catOpts}
          <option value="__new__">+ Nova categoria…</option>
        </select>
        <input type="text" id="noteTags" class="form-input" style="flex:1" placeholder="Tags (vírgula)" value="${(note?.tags || []).join(', ')}" />
      </div>
      <textarea id="noteContent" class="form-input" placeholder="Conteúdo da nota…" style="min-height:200px;resize:vertical">${esc(note?.content || '')}</textarea>
      <div style="font-size:.75rem;color:var(--text-muted);margin-top:.35rem" id="noteCharCount">0 caracteres</div>`,
      [
        { label: 'Cancelar', action: 'AtlasApp.closeModal()' },
        { label: note ? 'Salvar' : 'Criar Nota', action: `Notes.saveNote('${id || ''}')`, primary: true }
      ]
    );
    setTimeout(() => {
      const ta = document.getElementById('noteContent');
      const cc = document.getElementById('noteCharCount');
      if (ta && cc) { cc.textContent = `${ta.value.length} caracteres`; ta.addEventListener('input', () => cc.textContent = `${ta.value.length} caracteres`); }
      const catSel = document.getElementById('noteCategory');
      if (catSel) catSel.addEventListener('change', () => {
        if (catSel.value === '__new__') {
          const nc = prompt('Nome da nova categoria:');
          if (nc) { const opt = document.createElement('option'); opt.value = nc; opt.textContent = nc; opt.selected = true; catSel.insertBefore(opt, catSel.lastElementChild); catSel.value = nc; } else catSel.value = '';
        }
      });
      document.getElementById('noteTitle')?.focus();
    }, 60);
  }

  function saveNote(existingId) {
    const title = document.getElementById('noteTitle')?.value.trim();
    const content = document.getElementById('noteContent')?.value.trim();
    const category = document.getElementById('noteCategory')?.value;
    const tags = document.getElementById('noteTags')?.value.split(',').map(t => t.trim()).filter(Boolean);
    if (!title && !content) { AtlasApp.toast('Escreva algo antes de salvar.', 'error'); return; }
    if (existingId) {
      Storage.update('notes', existingId, { title: title || 'Sem título', content, category, tags });
      Storage.logActivity('Notas', `Nota "${title}" editada`);
      AtlasApp.toast('Nota salva!', 'success');
    } else {
      const now = new Date().toISOString();
      Storage.push('notes', { id: Storage.uid(), title: title || 'Sem título', content, category, tags, pinned: false, createdAt: now, updatedAt: now });
      Storage.logActivity('Notas', `Nota "${title}" criada`);
      AtlasApp.toast('Nota criada!', 'success');
    }
    AtlasApp.closeModal();
    render();
  }

  function openView(id) {
    const note = (Storage.get('notes') || []).find(n => n.id === id);
    if (!note) return;
    AtlasApp.openModal('Ver Nota', `
      <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:.75rem">${esc(note.title)}</h3>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;font-size:.8rem;color:var(--text-muted)">
        ${note.category ? `<span class="badge badge-primary">${esc(note.category)}</span>` : ''}
        <span>${new Date(note.createdAt || note.created_at).toLocaleString('pt-BR')}</span>
      </div>
      ${note.tags?.length ? `<div style="margin-bottom:1rem">${note.tags.map(t => `<span class="badge badge-muted">#${esc(t)}</span>`).join(' ')}</div>` : ''}
      <div style="font-size:.9375rem;line-height:1.7;white-space:pre-wrap;color:var(--text-2)">${esc(note.content || '')}</div>`,
      [
        { label: 'Fechar', action: 'AtlasApp.closeModal()' },
        { label: 'Editar', action: `AtlasApp.closeModal();Notes.openEdit('${id}')`, primary: true }
      ]
    );
  }

  function togglePin(id) {
    const note = (Storage.get('notes') || []).find(n => n.id === id);
    if (!note) return;
    Storage.update('notes', id, { pinned: !note.pinned });
    AtlasApp.toast(note.pinned ? 'Nota desafixada.' : 'Nota fixada!', 'info');
    render();
  }

  function deleteNote(id) {
    const note = (Storage.get('notes') || []).find(n => n.id === id);
    if (!confirm(`Excluir nota "${note?.title}"?`)) return;
    Storage.remove('notes', id);
    Storage.logActivity('Notas', `Nota "${note?.title}" excluída`);
    AtlasApp.toast('Nota excluída.', 'info');
    render();
  }

  function updateCategoryFilter() {
    const sel = document.getElementById('notesCategoryFilter');
    if (!sel) return;
    const cats = getCategories();
    const cur = sel.value;
    sel.innerHTML = '<option value="">Todas as categorias</option>' + cats.map(c => `<option value="${esc(c)}" ${cur === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
  }

  function getCategories() {
    return [...new Set((Storage.get('notes') || []).map(n => n.category).filter(Boolean))].sort();
  }

  function updateNavCount() {
    const el = document.getElementById('navNotesCount');
    const count = (Storage.get('notes') || []).length;
    if (el) { el.textContent = count || ''; el.style.display = count ? 'inline' : 'none'; }
  }

  function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : ''; }

  return { init, render, openAdd, openEdit, openView, saveNote, togglePin, deleteNote };
})();
