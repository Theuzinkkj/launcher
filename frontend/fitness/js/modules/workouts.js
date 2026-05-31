/* ===== WORKOUTS MODULE ===== */

const Workouts = (() => {
  let _workouts = [];
  const MUSCLE_GROUPS = ['Peito','Costas','Ombro','Bíceps','Tríceps','Pernas','Abdômen','Glúteos','Cardio'];
  const TYPES = { A:'Treino A', B:'Treino B', C:'Treino C', D:'Treino D', E:'Treino E', fullbody:'Full Body', hiit:'HIIT', cardio:'Cardio', personalizado:'Personalizado' };

  async function init() { await load(); }

  async function load() {
    const r = await FitnessAPI.get('/workouts');
    if (r.ok) _workouts = r.data || [];
  }

  function render() {
    const el = document.getElementById('workoutsContent');
    if (!el) return;
    if (!_workouts.length) {
      el.innerHTML = `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg><h3>Nenhum treino criado</h3><p>Crie seu primeiro plano de treino personalizado.</p><button class="btn btn-fit" onclick="Workouts.openAdd()">Criar Treino</button></div>`;
      return;
    }
    el.innerHTML = `<div class="workouts-grid">${_workouts.map(buildCard).join('')}</div>`;
  }

  function buildCard(w) {
    const exercises = w.exercises || [];
    return `<div class="workout-card">
      <div class="workout-card-header">
        <div class="workout-name">${esc(w.name)}</div>
        <span class="workout-type-badge">${TYPES[w.type] || w.type || 'Personalizado'}</span>
      </div>
      ${w.muscle_groups?.length ? `<div class="workout-muscles">${w.muscle_groups.map(m=>`<span class="muscle-tag">${m}</span>`).join('')}</div>` : ''}
      <div style="font-size:.8125rem;color:var(--text-muted);margin-bottom:.875rem">${exercises.length} exercício(s)${w.estimated_duration?` · ~${w.estimated_duration}min`:''}</div>
      ${exercises.length ? `<div style="font-size:.8rem;color:var(--text-2);margin-bottom:.875rem;line-height:1.6">${exercises.slice(0,3).map(e=>`<div>• ${esc(e.name)} — ${e.sets}x${e.reps}${e.weight?' ('+e.weight+'kg)':''}</div>`).join('')}${exercises.length>3?`<div style="color:var(--text-muted)">e mais ${exercises.length-3}…</div>`:''}</div>` : ''}
      <div class="workout-actions">
        <button class="btn btn-fit btn-sm" onclick="Workouts.openLogSession('${w.id}','${esc(w.name)}')">▶ Registrar</button>
        <button class="btn btn-ghost btn-sm" onclick="Workouts.openEdit('${w.id}')">✏️ Editar</button>
        <button class="btn btn-ghost btn-sm" onclick="Workouts.deleteWorkout('${w.id}','${esc(w.name)}')" style="color:var(--danger)">🗑️</button>
      </div>
    </div>`;
  }

  function openAdd() { openEdit(null); }

  function openEdit(id) {
    const w = id ? _workouts.find(x => x.id === id) : null;
    const exercises = w?.exercises || [];
    const mgChecked = w?.muscle_groups || [];
    FitnessApp.openModal(w ? 'Editar Treino' : 'Novo Treino', `
      <div class="form-group"><label class="form-label">Nome do treino</label><input type="text" id="wName" class="form-input" value="${esc(w?.name||'')}" placeholder="Ex: Treino A — Peito e Tríceps"/></div>
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select id="wType" class="form-input">
            ${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${w?.type===k?'selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Duração estimada (min)</label><input type="number" id="wDuration" class="form-input" value="${w?.estimated_duration||60}" min="10" max="180"/></div>
      </div>
      <div class="form-group"><label class="form-label">Grupos musculares</label>
        <div style="display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem">${MUSCLE_GROUPS.map(m=>`<label style="display:flex;align-items:center;gap:.35rem;cursor:pointer;font-size:.8125rem"><input type="checkbox" value="${m}" ${mgChecked.includes(m)?'checked':''} style="accent-color:var(--fit-primary)"/> ${m}</label>`).join('')}</div>
      </div>
      <div class="form-group">
        <label class="form-label">Exercícios</label>
        <div style="display:grid;grid-template-columns:2fr 55px 55px 65px 65px 28px;gap:.25rem;font-size:.7rem;color:var(--text-muted);padding:.25rem .375rem;font-weight:600">
          <span>Exercício</span><span style="text-align:center">Séries</span><span style="text-align:center">Reps</span><span style="text-align:center">Carga(kg)</span><span style="text-align:center">Desc(s)</span><span></span>
        </div>
        <div class="exercise-list" id="exerciseList">
          ${exercises.map(exRow).join('') || exRow()}
        </div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="Workouts.addExRow()" style="margin-top:.5rem">+ Adicionar exercício</button>
      </div>`,
      [
        { label: 'Cancelar', action: 'FitnessApp.closeModal()' },
        { label: w ? 'Salvar' : 'Criar Treino', action: `Workouts.save('${id||''}')`, primary: true }
      ]
    );
    document.getElementById('wName')?.focus();
  }

  function exRow(e) {
    return `<div class="exercise-row">
      <input type="text" class="ex-name" placeholder="Nome do exercício" value="${esc(e?.name||'')}"/>
      <input type="number" class="ex-sets" placeholder="3" value="${e?.sets||3}" min="1"/>
      <input type="text" class="ex-reps" placeholder="10" value="${e?.reps||'10'}"/>
      <input type="number" class="ex-weight" placeholder="0" value="${e?.weight||''}" step="0.5"/>
      <input type="number" class="ex-rest" placeholder="60" value="${e?.rest_seconds||60}"/>
      <button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:1rem;padding:0">×</button>
    </div>`;
  }

  function addExRow() {
    const list = document.getElementById('exerciseList');
    if (list) list.insertAdjacentHTML('beforeend', exRow());
  }

  async function save(id) {
    const name = document.getElementById('wName')?.value.trim();
    if (!name) { FitnessApp.toast('Digite um nome para o treino.', 'error'); return; }
    const type = document.getElementById('wType')?.value;
    const duration = parseInt(document.getElementById('wDuration')?.value)||60;
    const muscle_groups = [...document.querySelectorAll('#modalBody input[type=checkbox]:checked')].map(c=>c.value);
    const exercises = [...document.querySelectorAll('.exercise-row')].map(row => ({
      name: row.querySelector('.ex-name')?.value.trim(),
      sets: parseInt(row.querySelector('.ex-sets')?.value)||3,
      reps: row.querySelector('.ex-reps')?.value||'10',
      weight: parseFloat(row.querySelector('.ex-weight')?.value)||null,
      rest_seconds: parseInt(row.querySelector('.ex-rest')?.value)||60
    })).filter(e => e.name);

    const body = { name, type, estimated_duration: duration, muscle_groups, exercises };
    const r = id ? await FitnessAPI.put(`/workouts/${id}`, body) : await FitnessAPI.post('/workouts', body);
    if (r.ok) { FitnessApp.toast(id?'Treino atualizado!':'Treino criado!','success'); FitnessApp.closeModal(); await load(); render(); }
    else FitnessApp.toast(r.error||'Erro ao salvar.','error');
  }

  function openLogSession(workoutId, workoutName) {
    FitnessApp.openModal('Registrar Sessão de Treino', `
      <div class="form-group"><label class="form-label">Treino</label><input class="form-input" value="${workoutName}" readonly/></div>
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Data</label><input type="date" id="logDate" class="form-input" value="${FitnessApp.today()}"/></div>
        <div class="form-group"><label class="form-label">Duração (min)</label><input type="number" id="logDuration" class="form-input" placeholder="60" min="1"/></div>
      </div>
      <div class="form-group"><label class="form-label">Notas</label><textarea id="logNotes" class="form-input" placeholder="Como foi o treino? Observações…" rows="3"></textarea></div>
      <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;margin-top:.25rem"><input type="checkbox" id="logCompleted" checked style="accent-color:var(--fit-primary);width:16px;height:16px"/> <span style="font-size:.9rem">Treino concluído</span></label>`,
      [
        { label: 'Cancelar', action: 'FitnessApp.closeModal()' },
        { label: '💪 Salvar Sessão', action: `Workouts.saveLog('${workoutId}','${workoutName}')`, primary: true }
      ]
    );
  }

  async function saveLog(workoutId, workoutName) {
    const body = {
      workout_id: workoutId, workout_name: workoutName,
      date: document.getElementById('logDate')?.value || FitnessApp.today(),
      duration_minutes: parseInt(document.getElementById('logDuration')?.value)||null,
      notes: document.getElementById('logNotes')?.value||'',
      completed: document.getElementById('logCompleted')?.checked ?? true
    };
    const r = await FitnessAPI.post('/workout-logs', body);
    if (r.ok) { FitnessApp.toast('Sessão registrada! 💪', 'success'); FitnessApp.closeModal(); }
    else FitnessApp.toast(r.error||'Erro ao salvar.','error');
  }

  async function deleteWorkout(id, name) {
    if (!confirm(`Excluir treino "${name}"?`)) return;
    const r = await FitnessAPI.del(`/workouts/${id}`);
    if (r.ok) { FitnessApp.toast('Treino excluído.','info'); await load(); render(); }
    else FitnessApp.toast(r.error||'Erro.','error');
  }

  function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  return { init, render, openAdd, openEdit, addExRow, save, openLogSession, saveLog, deleteWorkout };
})();
