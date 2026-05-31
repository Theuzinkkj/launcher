/* ============================================================
   ATLAS HUB — links.js
   Links / Bookmarks module
   ============================================================ */
const Links = (() => {
  let searchQuery    = '';
  let categoryFilter = 'all';

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getCategories() {
    const links = Storage.get('links') || [];
    const cats  = [...new Set(links.map(l => l.category).filter(Boolean))];
    return cats;
  }

  /* ---- render ---- */
  function render() {
    let links = Storage.get('links') || [];

    // filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      links = links.filter(l =>
        (l.title       || '').toLowerCase().includes(q) ||
        (l.url         || '').toLowerCase().includes(q) ||
        (l.category    || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      links = links.filter(l => l.category === categoryFilter);
    }

    // favorites
    const favs   = links.filter(l => l.favorite);
    const others = links.filter(l => !l.favorite);

    // category filter dropdown
    const catFilter = document.getElementById('linksCategoryFilter');
    if (catFilter) {
      const cats = getCategories();
      const current = catFilter.value;
      catFilter.innerHTML = `<option value="all">Todas categorias</option>
        ${cats.map(c => `<option value="${escHtml(c)}" ${c === current ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}`;
      if (!cats.includes(current) && current !== 'all') catFilter.value = 'all';
    }

    // favorites section
    const favSection = document.getElementById('linksFavSection');
    const favGrid    = document.getElementById('linksFavGrid');
    if (favGrid) {
      if (favs.length && !searchQuery && categoryFilter === 'all') {
        if (favSection) favSection.style.display = '';
        favGrid.innerHTML = favs.map(l => buildCard(l)).join('');
      } else {
        if (favSection) favSection.style.display = 'none';
      }
    }

    // all links
    const grid  = document.getElementById('linksGrid');
    const empty = document.getElementById('linksEmpty');
    if (!grid) return;

    const display = searchQuery || categoryFilter !== 'all' ? links : others;

    if (!display.length) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'flex';
    } else {
      if (empty) empty.style.display = 'none';
      grid.innerHTML = display.map(l => buildCard(l)).join('');
    }
  }

  function buildCard(link) {
    const domain = (() => {
      try { return new URL(link.url).hostname; } catch { return ''; }
    })();
    return `
      <div class="link-card" data-id="${link.id}">
        <div class="link-card-header">
          <div class="link-emoji">${link.emoji || '🔗'}</div>
          <div style="flex:1;min-width:0">
            <div class="link-title">${escHtml(link.title || domain || link.url)}</div>
            ${link.category ? `<span class="link-category">${escHtml(link.category)}</span>` : ''}
          </div>
          <button class="link-fav-btn" onclick="Links.toggleFav('${link.id}')" title="${link.favorite ? 'Remover favorito' : 'Favoritar'}">
            ${link.favorite ? '⭐' : '☆'}
          </button>
        </div>
        <a class="link-url" href="${escHtml(link.url)}" target="_blank" rel="noopener noreferrer">
          ${escHtml(link.url.length > 40 ? link.url.substring(0, 40) + '…' : link.url)}
        </a>
        ${link.description ? `<div class="link-desc">${escHtml(link.description.substring(0,80))}${link.description.length>80?'…':''}</div>` : ''}
        <div class="link-actions">
          <a class="btn btn-sm btn-outline" href="${escHtml(link.url)}" target="_blank" rel="noopener noreferrer">🔗 Abrir</a>
          <button class="btn btn-sm btn-outline" onclick="Links.openEdit('${link.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="Links.delete('${link.id}')">🗑</button>
        </div>
      </div>`;
  }

  /* ---- toggle fav ---- */
  function toggleFav(id) {
    const links = Storage.get('links') || [];
    const link  = links.find(l => l.id === id);
    if (!link) return;
    Storage.update('links', id, { favorite: !link.favorite });
    render();
  }

  /* ---- add / edit ---- */
  function openAdd() {
    _openModal(null);
  }

  function openEdit(id) {
    const link = (Storage.get('links') || []).find(l => l.id === id);
    if (!link) return;
    _openModal(link);
  }

  function _openModal(link) {
    const isEdit = !!link;
    AtlasApp.openModal(isEdit ? 'Editar Link' : 'Novo Link', `
      <div class="form-group">
        <label class="form-label">URL *</label>
        <input type="url" id="linkUrl" class="form-input" placeholder="https://..."
          value="${isEdit ? escHtml(link.url) : ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" id="linkTitle" class="form-input" placeholder="Nome do link"
            value="${isEdit ? escHtml(link.title||'') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Emoji / Ícone</label>
          <input type="text" id="linkEmoji" class="form-input" placeholder="🔗" maxlength="4"
            value="${isEdit ? escHtml(link.emoji||'') : ''}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <input type="text" id="linkCategory" class="form-input" placeholder="Ex: Trabalho, Dev..."
            value="${isEdit ? escHtml(link.category||'') : ''}">
        </div>
        <div class="form-group" style="display:flex;align-items:flex-end">
          <label class="toggle-wrap" style="margin-bottom:6px">
            <div class="toggle">
              <input type="checkbox" id="linkFav" ${isEdit && link.favorite ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </div>
            <span>Favorito</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="linkDesc" class="form-input" rows="2" placeholder="Sobre este link...">${isEdit ? escHtml(link.description||'') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: isEdit ? 'Salvar' : 'Adicionar', class: 'btn-primary', action: () => save(isEdit ? link.id : null) }
    ]);
    setTimeout(() => { const inp = document.getElementById('linkUrl'); if (inp) { inp.focus(); inp.select(); } }, 100);
  }

  function save(editId) {
    const url      = (document.getElementById('linkUrl')      ||{}).value?.trim() || '';
    const title    = (document.getElementById('linkTitle')    ||{}).value?.trim() || '';
    const emoji    = (document.getElementById('linkEmoji')    ||{}).value?.trim() || '🔗';
    const category = (document.getElementById('linkCategory') ||{}).value?.trim() || '';
    const favorite = !!(document.getElementById('linkFav')    ||{}).checked;
    const desc     = (document.getElementById('linkDesc')     ||{}).value?.trim() || '';

    if (!url) { AtlasApp.toast('Informe a URL', 'error'); return; }

    const now = new Date().toISOString();
    if (editId) {
      Storage.update('links', editId, { url, title, emoji, category, favorite, description: desc });
      AtlasApp.toast('Link atualizado!', 'success');
      Storage.logActivity('Links', `"${title || url}" atualizado`);
    } else {
      Storage.push('links', {
        id: Storage.uid(), url, title, emoji, category, favorite, description: desc,
        createdAt: now
      });
      AtlasApp.toast('Link adicionado!', 'success');
      Storage.logActivity('Links', `"${title || url}" adicionado`);
    }
    AtlasApp.closeModal();
    render();
  }

  /* ---- delete ---- */
  function deleteLink(id) {
    const link = (Storage.get('links') || []).find(l => l.id === id);
    if (!link) return;
    AtlasApp.openModal('Excluir Link', `<p>Excluir <strong>${escHtml(link.title || link.url)}</strong>?</p>`, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir',  class: 'btn-danger',  action: () => {
        Storage.remove('links', id);
        Storage.logActivity('Links', `"${link.title || link.url}" excluído`);
        AtlasApp.toast('Link excluído', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- search & filter ---- */
  function setupSearch() {
    const inp = document.getElementById('linksSearch');
    if (!inp) return;
    inp.addEventListener('input', () => {
      searchQuery = inp.value.trim();
      render();
    });
  }

  function setupCategoryFilter() {
    const sel = document.getElementById('linksCategoryFilter');
    if (!sel) return;
    sel.addEventListener('change', () => {
      categoryFilter = sel.value;
      render();
    });
  }

  /* ---- public API ---- */
  function init() {
    setupSearch();
    setupCategoryFilter();
  }

  return { init, render, openAdd, openEdit, toggleFav, delete: deleteLink };
})();
