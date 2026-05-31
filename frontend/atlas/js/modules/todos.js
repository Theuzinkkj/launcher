/* ============================================================
   ATLAS HUB — todos.js
   Tarefas module
   ============================================================ */
const Todos = (() => {
  let currentFilter = 'all';
  let searchQuery   = '';

  const el = (id) => document.getElementById(id);

  function todayStr() {
    return new Date().toISOString().split('T')[0];
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(str) {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  /* ---- render ---- */
  function render() {
    const todos  = Storage.get('todos') || [];
    const today  = todayStr();
    const query  = searchQuery.toLowerCase();

    // filter
    let filtered = todos.filter(t => {
      if (query) {
        const match = t.title.toLowerCase().includes(query) ||
                      (t.description || '').toLowerCase().includes(query) ||
                      (t.category    || '').toLowerCase().includes(query);
        if (!match) return false;
      }
      switch (currentFilter) {
        case 'pending':  return !t.done;
        case 'done':     return  t.done;
        case 'high':     return !t.done && t.priority === 'high';
        case 'overdue':  return !t.done && t.dueDate && t.dueDate < today;
        default:         return true;
      }
    });

    // sort: high priority first, then by dueDate
    const pOrder = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
      if (!a.done && !b.done) {
        const pdiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
        if (pdiff !== 0) return pdiff;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return  1;
      }
      if (!a.done) return -1;
      if (!b.done) return  1;
      return 0;
    });

    // stats
    const total    = todos.length;
    const pending  = todos.filter(t => !t.done).length;
    const done     = todos.filter(t =>  t.done).length;
    const overdue  = todos.filter(t => !t.done && t.dueDate && t.dueDate < today).length;

    const statsEl = el('todosStats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="todos-stat"><div class="todos-stat-value">${total}</div><div class="todos-stat-label">Total</div></div>
        <div class="todos-stat"><div class="todos-stat-value" style="color:var(--warning)">${pending}</div><div class="todos-stat-label">Pendentes</div></div>
        <div class="todos-stat"><div class="todos-stat-value" style="color:var(--success)">${done}</div><div class="todos-stat-label">Concluídas</div></div>
        <div class="todos-stat"><div class="todos-stat-value" style="color:var(--danger)">${overdue}</div><div class="todos-stat-label">Atrasadas</div></div>
      `;
    }

    // subtitle
    const sub = el('todosSubtitle');
    if (sub) sub.textContent = `${pending} tarefa${pending !== 1 ? 's' : ''} pendente${pending !== 1 ? 's' : ''}`;

    // nav count
    const navCount = el('navTodosCount');
    if (navCount) navCount.textContent = pending || '';

    // list
    const list  = el('todosList');
    const empty = el('todosEmpty');
    if (!list) return;

    if (!filtered.length) {
      list.innerHTML  = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = filtered.map(t => {
      const isOverdue = !t.done && t.dueDate && t.dueDate < today;
      return `
        <div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
          <div class="todo-check ${t.done ? 'checked' : ''}" onclick="Todos.toggle('${t.id}')"></div>
          <div class="todo-content">
            <div class="todo-title">${escHtml(t.title)}</div>
            <div class="todo-meta">
              <span class="priority-badge ${t.priority || 'low'}">${t.priority || 'low'}</span>
              ${t.category ? `<span class="badge badge-muted">${escHtml(t.category)}</span>` : ''}
              ${t.dueDate  ? `<span class="todo-due ${isOverdue ? 'overdue' : ''}">
                ${isOverdue ? '⚠ ' : '📅 '}${formatDate(t.dueDate)}</span>` : ''}
              ${t.description ? `<span style="font-size:12px;color:var(--text-muted)">${escHtml(t.description.substring(0,40))}${t.description.length>40?'…':''}</span>` : ''}
            </div>
          </div>
          <div class="todo-actions">
            <button class="btn-icon" onclick="Todos.openEdit('${t.id}')" title="Editar">✏️</button>
            <button class="btn-icon" onclick="Todos.delete('${t.id}')" title="Excluir">🗑️</button>
          </div>
        </div>`;
    }).join('');
  }

  /* ---- toggle ---- */
  function toggle(id) {
    const todos = Storage.get('todos') || [];
    const todo  = todos.find(t => t.id === id);
    if (!todo) return;
    const done  = !todo.done;
    Storage.update('todos', id, {
      done,
      completedAt: done ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    });
    Storage.logActivity('Tarefas', done ? `"${todo.title}" concluída` : `"${todo.title}" reaberta`);
    render();
  }

  /* ---- add / edit ---- */
  function openAdd() {
    _openModal(null);
  }

  function openEdit(id) {
    const todo = (Storage.get('todos') || []).find(t => t.id === id);
    if (!todo) return;
    _openModal(todo);
  }

  function _openModal(todo) {
    const isEdit = !!todo;
    AtlasApp.openModal(isEdit ? 'Editar Tarefa' : 'Nova Tarefa', `
      <div class="form-group">
        <label class="form-label">Título *</label>
        <input type="text" id="todoTitle" class="form-input" placeholder="O que precisa ser feito?" value="${isEdit ? escHtml(todo.title) : ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Prioridade</label>
          <select id="todoPriority" class="select-input">
            <option value="low"    ${isEdit && todo.priority==='low'    ? 'selected' : ''}>Baixa</option>
            <option value="medium" ${!isEdit || todo.priority==='medium' ? 'selected' : ''}>Média</option>
            <option value="high"   ${isEdit && todo.priority==='high'   ? 'selected' : ''}>Alta</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Data Limite</label>
          <input type="date" id="todoDueDate" class="form-input" value="${isEdit ? (todo.dueDate||'') : ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <input type="text" id="todoCategory" class="form-input" placeholder="Ex: Trabalho, Pessoal..." value="${isEdit ? escHtml(todo.category||'') : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <textarea id="todoDesc" class="form-input" rows="2" placeholder="Detalhes opcionais...">${isEdit ? escHtml(todo.description||'') : ''}</textarea>
      </div>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: isEdit ? 'Salvar' : 'Adicionar', class: 'btn-primary', action: () => save(isEdit ? todo.id : null) }
    ]);
    setTimeout(() => { const inp = document.getElementById('todoTitle'); if (inp) inp.focus(); }, 100);
  }

  function save(editId) {
    const title    = (document.getElementById('todoTitle')    ||{}).value?.trim() || '';
    const priority = (document.getElementById('todoPriority') ||{}).value || 'medium';
    const dueDate  = (document.getElementById('todoDueDate')  ||{}).value || '';
    const category = (document.getElementById('todoCategory') ||{}).value?.trim() || '';
    const desc     = (document.getElementById('todoDesc')     ||{}).value?.trim() || '';

    if (!title) { AtlasApp.toast('Informe o título da tarefa', 'error'); return; }

    const now = new Date().toISOString();
    if (editId) {
      Storage.update('todos', editId, { title, priority, dueDate, category, description: desc, updatedAt: now });
      AtlasApp.toast('Tarefa atualizada!', 'success');
      Storage.logActivity('Tarefas', `"${title}" atualizada`);
    } else {
      Storage.push('todos', {
        id: Storage.uid(), title, priority, dueDate, category, description: desc,
        done: false, completedAt: null, createdAt: now, updatedAt: now
      });
      AtlasApp.toast('Tarefa adicionada!', 'success');
      Storage.logActivity('Tarefas', `"${title}" adicionada`);
    }
    AtlasApp.closeModal();
    render();
  }

  /* ---- delete ---- */
  function deleteTodo(id) {
    const todo = (Storage.get('todos') || []).find(t => t.id === id);
    if (!todo) return;
    AtlasApp.openModal('Excluir Tarefa', `
      <p>Excluir a tarefa <strong>${escHtml(todo.title)}</strong>?</p>
    `, [
      { label: 'Cancelar', class: 'btn-outline', action: () => AtlasApp.closeModal() },
      { label: 'Excluir', class: 'btn-danger', action: () => {
        Storage.remove('todos', id);
        Storage.logActivity('Tarefas', `"${todo.title}" excluída`);
        AtlasApp.toast('Tarefa excluída', 'success');
        AtlasApp.closeModal();
        render();
      }}
    ]);
  }

  /* ---- filter ---- */
  function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('#todosFilterBar .filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    render();
  }

  /* ---- search ---- */
  function setupSearch() {
    const inp = document.getElementById('todosSearch');
    if (!inp) return;
    inp.addEventListener('input', () => {
      searchQuery = inp.value.trim();
      render();
    });
  }

  function setupFilters() {
    const bar = document.getElementById('todosFilterBar');
    if (!bar) return;
    bar.querySelectorAll('.filter-btn').forEach(b => {
      b.addEventListener('click', () => setFilter(b.dataset.filter));
    });
  }

  /* ---- public API ---- */
  function init() {
    setupSearch();
    setupFilters();
  }

  return { init, render, toggle, openAdd, openEdit, delete: deleteTodo, setFilter };
})();
