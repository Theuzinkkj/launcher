/* ===== PROGRESS MODULE ===== */

const Progress = (() => {
  let _measurements = [];
  let _profile = null;

  async function init() {
    const [mr, pr] = await Promise.all([FitnessAPI.get('/measurements'), FitnessAPI.get('/profile')]);
    if (mr.ok) _measurements = mr.data || [];
    if (pr.ok) _profile = pr.data;
  }

  function render() {
    const el = document.getElementById('progressContent');
    if (!el) return;
    const latest = _measurements[0] || null;
    const height = _profile?.height;
    const bmi = latest?.weight && height ? (latest.weight / ((height/100)**2)).toFixed(1) : null;
    const bmiClass = bmi ? (bmi<18.5?'Abaixo do peso':bmi<25?'Normal':bmi<30?'Sobrepeso':'Obesidade') : null;

    el.innerHTML = `
      <div class="stats-grid" style="margin-bottom:1.5rem">
        <div class="stat-card workout"><div class="stat-label">⚖️ Peso Atual</div><div><span class="stat-value">${latest?.weight||'—'}</span><span class="stat-unit"> kg</span></div><div class="stat-sub">${latest?FitnessApp.fmtDate(latest.date):'Sem registro'}</div></div>
        <div class="stat-card protein"><div class="stat-label">📊 % Gordura</div><div><span class="stat-value">${latest?.body_fat_percentage||'—'}</span><span class="stat-unit">${latest?.body_fat_percentage?' %':''}</span></div><div class="stat-sub">${latest?.body_fat_percentage?'corporal':' '}</div></div>
        <div class="stat-card calories"><div class="stat-label">📐 IMC</div><div><span class="stat-value">${bmi||'—'}</span></div><div class="stat-sub">${bmiClass||'Configure altura no Perfil'}</div></div>
        <div class="stat-card water"><div class="stat-label">📏 Cintura</div><div><span class="stat-value">${latest?.waist||'—'}</span><span class="stat-unit">${latest?.waist?' cm':''}</span></div><div class="stat-sub">${latest?FitnessApp.fmtDate(latest.date):' '}</div></div>
      </div>

      ${_measurements.length >= 2 ? `
        <div class="fit-card" style="margin-bottom:1.5rem">
          <div style="font-size:.9375rem;font-weight:600;margin-bottom:.875rem">📈 Evolução do Peso</div>
          ${weightChart()}
        </div>` : ''}

      <div class="fit-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-size:.9375rem;font-weight:600">📋 Histórico de Medidas</span>
          <span style="font-size:.8rem;color:var(--text-muted)">${_measurements.length} registro(s)</span>
        </div>
        ${_measurements.length ? `<div class="measurements-list">${_measurements.slice(0,10).map(buildMeasCard).join('')}</div>` : `
          <div class="empty-state" style="padding:1.5rem">
            <p>Nenhuma medida registrada ainda.</p>
            <button class="btn btn-fit btn-sm" onclick="Progress.openAddMeasurement()">Registrar primeira medida</button>
          </div>`}
      </div>`;
  }

  function weightChart() {
    const data = _measurements.slice(0,10).reverse().filter(m=>m.weight);
    if (data.length < 2) return '<p style="color:var(--text-muted);font-size:.875rem">Registre mais medidas para ver o gráfico.</p>';
    const weights = data.map(m=>parseFloat(m.weight));
    const min = Math.min(...weights) - 1, max = Math.max(...weights) + 1;
    const w=600, h=100, pad=20;
    const x = (i) => pad + (i/(data.length-1))*(w-pad*2);
    const y = (v) => h - pad - ((v-min)/(max-min))*(h-pad*2);
    const pts = data.map((m,i)=>`${x(i).toFixed(1)},${y(parseFloat(m.weight)).toFixed(1)}`).join(' ');
    const area = data.map((m,i)=>`${x(i).toFixed(1)},${y(parseFloat(m.weight)).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" class="weight-chart" style="overflow:visible">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--fit-primary)" stop-opacity=".2"/><stop offset="1" stop-color="var(--fit-primary)" stop-opacity="0"/></linearGradient></defs>
      <polyline points="${area} ${x(data.length-1).toFixed(1)},${h} ${x(0).toFixed(1)},${h}" fill="url(#cg)"/>
      <polyline class="chart-line" points="${pts}"/>
      ${data.map((m,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(parseFloat(m.weight)).toFixed(1)}" r="4" fill="var(--fit-primary)"/>`).join('')}
      ${data.map((m,i)=>`<text x="${x(i).toFixed(1)}" y="${(y(parseFloat(m.weight))-8).toFixed(1)}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${m.weight}kg</text>`).join('')}
    </svg>`;
  }

  function buildMeasCard(m) {
    return `<div class="measurement-card">
      <div><div style="font-weight:600;font-size:.9rem">${FitnessApp.fmtDate(m.date)}</div></div>
      <div class="measurement-values">
        ${m.weight?`<div class="measurement-val"><div class="val">${m.weight}</div><div class="label">kg</div></div>`:''}
        ${m.body_fat_percentage?`<div class="measurement-val"><div class="val">${m.body_fat_percentage}%</div><div class="label">Gordura</div></div>`:''}
        ${m.waist?`<div class="measurement-val"><div class="val">${m.waist}cm</div><div class="label">Cintura</div></div>`:''}
        ${m.chest?`<div class="measurement-val"><div class="val">${m.chest}cm</div><div class="label">Peito</div></div>`:''}
      </div>
      <button onclick="Progress.deleteMeasurement('${m.id}')" style="background:none;border:none;cursor:pointer;color:var(--danger)">🗑️</button>
    </div>`;
  }

  function openAddMeasurement() {
    FitnessApp.openModal('Registrar Medida Corporal', `
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Data</label><input type="date" id="mDate" class="form-input" value="${FitnessApp.today()}"/></div>
        <div class="form-group"><label class="form-label">Peso (kg)</label><input type="number" id="mWeight" class="form-input" placeholder="75.0" step="0.1" min="30" max="300"/></div>
        <div class="form-group"><label class="form-label">% Gordura</label><input type="number" id="mFat" class="form-input" placeholder="15.0" step="0.1" min="1" max="60"/></div>
        <div class="form-group"><label class="form-label">Cintura (cm)</label><input type="number" id="mWaist" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Peito (cm)</label><input type="number" id="mChest" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Quadril (cm)</label><input type="number" id="mHips" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Braço E (cm)</label><input type="number" id="mArmL" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Braço D (cm)</label><input type="number" id="mArmR" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Coxa E (cm)</label><input type="number" id="mThighL" class="form-input" step="0.5"/></div>
        <div class="form-group"><label class="form-label">Coxa D (cm)</label><input type="number" id="mThighR" class="form-input" step="0.5"/></div>
      </div>
      <div class="form-group"><label class="form-label">Observações</label><textarea id="mNotes" class="form-input" rows="2" placeholder="Como está se sentindo?"></textarea></div>`,
      [
        { label: 'Cancelar', action: 'FitnessApp.closeModal()' },
        { label: '💾 Salvar Medida', action: 'Progress.saveMeasurement()', primary: true }
      ]
    );
    document.getElementById('mWeight')?.focus();
  }

  async function saveMeasurement() {
    const f = id => { const v=parseFloat(document.getElementById(id)?.value); return isNaN(v)||v===0?null:v; };
    const body = {
      date: document.getElementById('mDate')?.value || FitnessApp.today(),
      weight: f('mWeight'), body_fat_percentage: f('mFat'),
      waist: f('mWaist'), chest: f('mChest'), hips: f('mHips'),
      left_arm: f('mArmL'), right_arm: f('mArmR'),
      left_thigh: f('mThighL'), right_thigh: f('mThighR'),
      notes: document.getElementById('mNotes')?.value || ''
    };
    if (!body.weight && !body.body_fat_percentage) { FitnessApp.toast('Preencha pelo menos peso ou % gordura.','error'); return; }
    const r = await FitnessAPI.post('/measurements', body);
    if (r.ok) { FitnessApp.toast('Medida registrada!','success'); FitnessApp.closeModal(); _measurements.unshift(r.data); render(); }
    else FitnessApp.toast(r.error||'Erro.','error');
  }

  async function deleteMeasurement(id) {
    if (!confirm('Excluir esta medida?')) return;
    const r = await FitnessAPI.del(`/measurements/${id}`);
    if (r.ok) { _measurements = _measurements.filter(m=>m.id!==id); FitnessApp.toast('Excluída.','info'); render(); }
  }

  return { init, render, openAddMeasurement, saveMeasurement, deleteMeasurement };
})();
