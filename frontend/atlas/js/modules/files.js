/* ============================================================
   ATLAS HUB — files.js
   Gerenciador de arquivos module
   Uses localStorage as storage (IndexedDB/API fallback)
   ============================================================ */
const Files = (() => {
  const LS_KEY   = 'atlas_files';
  let currentPath = []; // array of folder names

  const FILE_ICONS = {
    pdf:  '📕', doc: '📝', docx:'📝', xls:'📊', xlsx:'📊',
    ppt:  '📋', pptx:'📋',
    jpg:  '🖼️', jpeg:'🖼️', png: '🖼️', gif:'🖼️', webp:'🖼️', svg:'🖼️',
    mp4:  '🎬', mov: '🎬', avi: '🎬', mkv:'🎬',
    mp3:  '🎵', wav: '🎵', flac:'🎵',
    zip:  '🗜️', rar: '🗜️', '7z':'🗜️',
    txt:  '📄', md:  '📄', json:'📄', csv:'📄',
    js:   '💻', ts:  '💻', py: '💻', html:'💻', css:'💻',
    folder: '📁'
  };

  function getIcon(name, isFolder) {
    if (isFolder) return '📁';
    const ext = name.split('.').pop().toLowerCase();
    return FILE_ICONS[ext] || '📄';
  }

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ---- storage helpers ---- */
  function getAll() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  }

  function saveAll(items) {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }

  function currentPathStr() {
    return currentPath.join('/');
  }

  function getItemsInPath() {
    const all = getAll();
    const path = currentPathStr();
    return all.filter(item => item.path === path);
  }

  /* ---- render ---- */
  function render() {
    renderBreadcrumb();
    renderGrid();
  }

  function renderBreadcrumb() {
    const bc = document.getElementById('filesBreadcrumb');
    if (!bc) return;
    let html = `<span class="breadcrumb-item" onclick="Files.navigateTo([])" data-path="[]">🏠 Início</span>`;
    currentPath.forEach((part, i) => {
      html += `<span class="breadcrumb-sep">/</span>`;
      const pathTo = currentPath.slice(0, i + 1);
      if (i === currentPath.length - 1) {
        html += `<span class="breadcrumb-item current">${escHtml(part)}</span>`;
      } else {
        html += `<span class="breadcrumb-item" onclick="Files.navigateTo(${JSON.stringify(pathTo)})">${escHtml(part)}</span>`;
      }
    });
    bc.innerHTML = html;
  }

  function renderGrid() {
    const grid = document.getElementById('filesGrid');
    if (!grid) return;
    const items = getItemsInPath();

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">📂</div>
          <h3>Pasta vazia</h3>
          <p>Arraste arquivos ou clique em "Upload" para adicionar.</p>
        </div>`;
      return;
    }

    // folders first
    const folders = items.filter(i => i.isFolder);
    const files   = items.filter(i => !i.isFolder);
    const sorted  = [...folders, ...files];

    grid.innerHTML = sorted.map(item => `
      <div class="file-card" data-id="${item.id}" onclick="Files._handleClick('${item.id}')">
        <div class="file-icon">${getIcon(item.name, item.isFolder)}</div>
        <div class="file-name">${escHtml(item.name)}</div>
        ${item.size ? `<div class="file-size">${formatSize(item.size)}</div>` : ''}
        <div class="file-actions" onclick="event.stopPropagation()">
          ${!item.isFolder ? `<button class="btn-icon" title="Download" onclick="Files.downloadFile('${item.id}')">⬇️</button>` : ''}
          <button class="btn-icon" title="Excluir" onclick="Files.deleteItem('${item.id}')">🗑️</button>
        </div>
      </div>`).join('');
  }

  function _handleClick(id) {
    const item = getAll().find(i => i.id === id);
    if (!item) return;
    if (item.isFolder) {
      currentPath = [...currentPath, item.name];
      render();
    } else if (item.dataUrl && item.type && item.type.startsWith('image/')) {
      previewImage(item);
    }
  }

  function navigateTo(pathArray) {
    currentPath = Array.isArray(pathArray) ? pathArray : JSON.parse(pathArray);
    render();
  }

  /* ---- image preview ---- */
  function previewImage(item) {
    AtlasApp.openModal(item.name, `
      <div style="text-align:center">
        <img src="${item.dataUrl}" alt="${escHtml(item.name)}"
          style="max-width:100%;max-height:400px;border-radius:8px">
      </div>
    `, [
      { label: 'Fechar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Download', class: 'btn-primary', action: () => { downloadFile(item.id); AtlasApp.closeModal(); } }
    ]);
  }

  /* ---- upload ---- */
  function handleUpload(event) {
    const fileList = event.target.files;
    if (!fileList || !fileList.length) return;
    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const all  = getAll();
        const path = currentPathStr();
        // check duplicate name
        const exists = all.find(i => i.path === path && i.name === file.name);
        if (exists) {
          AtlasApp.toast(`"${file.name}" já existe`, 'warning'); return;
        }
        all.push({
          id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: file.name, path, isFolder: false,
          size: file.size, type: file.type,
          dataUrl: file.type.startsWith('image/') ? e.target.result : null,
          createdAt: new Date().toISOString()
        });
        saveAll(all);
        Storage.logActivity('Arquivos', `"${file.name}" adicionado`);
        render();
        AtlasApp.toast(`"${file.name}" adicionado!`, 'success');
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
          const all  = getAll();
          const path = currentPathStr();
          const exists = all.find(i => i.path === path && i.name === file.name);
          if (exists) { AtlasApp.toast(`"${file.name}" já existe`, 'warning'); return; }
          all.push({
            id: 'f_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name, path, isFolder: false,
            size: file.size, type: file.type, dataUrl: null,
            createdAt: new Date().toISOString()
          });
          saveAll(all);
          Storage.logActivity('Arquivos', `"${file.name}" adicionado`);
          render();
          AtlasApp.toast(`"${file.name}" adicionado!`, 'success');
        };
      }
    });
    // reset input
    event.target.value = '';
  }

  /* ---- create folder ---- */
  function createFolder() {
    AtlasApp.openModal('Nova Pasta', `
      <div class="form-group">
        <label class="form-label">Nome da pasta *</label>
        <input type="text" id="folderName" class="form-input" placeholder="Nome da pasta">
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Criar', class: 'btn-primary', action: () => {
        const name = (document.getElementById('folderName') || {}).value?.trim() || '';
        if (!name) { AtlasApp.toast('Informe o nome da pasta', 'error'); return; }
        const all  = getAll();
        const path = currentPathStr();
        if (all.find(i => i.path === path && i.name === name && i.isFolder)) {
          AtlasApp.toast('Já existe uma pasta com este nome', 'error'); return;
        }
        all.push({
          id: 'dir_' + Date.now(),
          name, path, isFolder: true, size: 0, type: 'folder',
          createdAt: new Date().toISOString()
        });
        saveAll(all);
        Storage.logActivity('Arquivos', `Pasta "${name}" criada`);
        AtlasApp.closeModal();
        render();
        AtlasApp.toast(`Pasta "${name}" criada!`, 'success');
      }}
    ]);
    setTimeout(() => { const inp = document.getElementById('folderName'); if (inp) inp.focus(); }, 100);
  }

  /* ---- download ---- */
  function downloadFile(id) {
    const item = getAll().find(i => i.id === id);
    if (!item) return;
    if (!item.dataUrl) { AtlasApp.toast('Arquivo não disponível para download', 'warning'); return; }
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.name;
    a.click();
  }

  /* ---- delete ---- */
  function deleteItem(id) {
    const item = getAll().find(i => i.id === id);
    if (!item) return;
    AtlasApp.openModal('Excluir', `<p>Excluir <strong>${escHtml(item.name)}</strong>${item.isFolder ? ' e todo o seu conteúdo' : ''}?</p>`, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir',  class: 'btn-danger',  action: () => {
        let all = getAll();
        if (item.isFolder) {
          // remove folder and contents
          const prefix = item.path ? item.path + '/' + item.name : item.name;
          all = all.filter(i => i.id !== id && !i.path.startsWith(prefix));
        } else {
          all = all.filter(i => i.id !== id);
        }
        saveAll(all);
        Storage.logActivity('Arquivos', `"${item.name}" excluído`);
        AtlasApp.toast(item.isFolder ? 'Pasta excluída' : 'Arquivo excluído', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- drag & drop ---- */
  function setupDropZone() {
    const zone = document.getElementById('filesDropZone');
    if (!zone) return;
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const fakeEvent = { target: { files: e.dataTransfer.files, value: '' } };
      handleUpload(fakeEvent);
    });
    zone.addEventListener('click', () => {
      const inp = document.getElementById('filesInput');
      if (inp) inp.click();
    });
  }

  /* ---- public API ---- */
  function init() {
    setupDropZone();
    const inp = document.getElementById('filesInput');
    if (inp) inp.addEventListener('change', handleUpload);
  }

  return {
    init, render,
    handleUpload, createFolder,
    downloadFile, deleteItem,
    navigateTo, _handleClick
  };
})();
