/* ===== FITNESS DASHBOARD ===== */

const Dashboard = (() => {
  let _profile = null;

  async function init() {
    const r = await FitnessAPI.get('/profile');
    if (r.ok) _profile = r.data;
    await render();
    setInterval(render, 5 * 60 * 1000);
  }

  async function render() {
    const today = FitnessApp.today();
    const [sumRes, logsRes] = await Promise.all([
      FitnessAPI.get(`/daily-summary?date=${today}`),
      FitnessAPI.get(`/workout-logs?date=${today}`)
    ]);

    const sum = sumRes.ok ? sumRes.data : { calories:0, protein:0, carbs:0, fat:0, waterMl:0, workoutsCompleted:0, workoutsTotal:0 };
    const logs = logsRes.ok ? logsRes.data : [];
    const p = _profile || {};
    const calGoal  = p.daily_calorie_goal  || 2000;
    const protGoal = p.daily_protein_goal  || 150;
    const carbGoal = p.daily_carb_goal     || 250;
    const fatGoal  = p.daily_fat_goal      || 65;
    const waterGoal = (p.daily_water_goal  || 2.5) * 1000;

    const pct = (v, g) => Math.min(100, g > 0 ? Math.round(v/g*100) : 0);

    const el = document.getElementById('dashboardContent');
    if (!el) return;

    el.innerHTML = `
      <div class="stats-grid">
        ${statCard('calories','🔥','Calorias',Math.round(sum.calories),`/ ${calGoal} kcal`,pct(sum.calories,calGoal),'#f97316',`${calGoal-Math.round(sum.calories)} restantes`)}
        ${statCard('protein','🥩','Proteína',Math.round(sum.protein),'g',pct(sum.protein,protGoal),'#ef4444',`meta: ${protGoal}g`)}
        ${statCard('water','💧','Água',`${(sum.waterMl/1000).toFixed(1)}`,`/ ${p.daily_water_goal||2.5}L`,pct(sum.waterMl,waterGoal),'#3b82f6',`${sum.waterMl}ml`)}
        ${statCard('workout','💪','Treinos',sum.workoutsCompleted,`/ ${sum.workoutsTotal||'—'}`,sum.workoutsTotal>0?pct(sum.workoutsCompleted,sum.workoutsTotal):0,'#10b981',sum.workoutsTotal===0?'Nenhum agendado':'concluídos')}
      </div>

      <div class="dash-grid" style="margin-bottom:1rem">
        <div class="fit-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <span style="font-size:.9375rem;font-weight:600">Macros do Dia</span>
            <a onclick="FitnessApp.navigate('nutrition')" href="javascript:void(0)" style="font-size:.8rem;color:var(--fit-primary)">Ver refeições →</a>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem">
            ${macroRing('Proteína',Math.round(sum.protein),protGoal,'g','#ef4444')}
            ${macroRing('Carbs',Math.round(sum.carbs),carbGoal,'g','#f59e0b')}
            ${macroRing('Gordura',Math.round(sum.fat),fatGoal,'g','#10b981')}
          </div>
        </div>

        <div class="fit-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <span style="font-size:.9375rem;font-weight:600">Hidratação</span>
            <span style="font-size:.8rem;color:var(--text-muted)">${pct(sum.waterMl,waterGoal)}%</span>
          </div>
          <div class="water-display" style="padding:.75rem">
            <div class="water-amount">${(sum.waterMl/1000).toFixed(1)}L</div>
            <div class="water-goal">meta: ${p.daily_water_goal||2.5}L</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(sum.waterMl,waterGoal)}%"></div></div>
          </div>
          <div class="water-buttons" style="margin-top:.75rem">
            <button class="water-btn" onclick="Dashboard.addWater(150)">+150ml</button>
            <button class="water-btn" onclick="Dashboard.addWater(200)">+200ml</button>
            <button class="water-btn" onclick="Dashboard.addWater(350)">+350ml</button>
            <button class="water-btn" onclick="Dashboard.addWater(500)">+500ml</button>
          </div>
        </div>
      </div>

      <div class="fit-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
          <span style="font-size:.9375rem;font-weight:600">Treinos de Hoje</span>
          <a onclick="FitnessApp.navigate('workouts')" href="javascript:void(0)" style="font-size:.8rem;color:var(--fit-primary)">Gerenciar →</a>
        </div>
        ${logs.length ? `<div style="display:flex;flex-direction:column;gap:.5rem">${logs.map(l=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:.625rem .875rem;background:var(--surface-2);border-radius:var(--radius-sm)">
            <div style="display:flex;align-items:center;gap:.625rem">
              <span style="font-size:1.1rem">${l.completed?'✅':'⏳'}</span>
              <div>
                <div style="font-weight:600;font-size:.9rem">${esc(l.workout_name)}</div>
                ${l.duration_minutes?`<div style="font-size:.75rem;color:var(--text-muted)">${l.duration_minutes} min</div>`:''}
              </div>
            </div>
            ${!l.completed?`<button class="btn btn-fit btn-sm" onclick="Dashboard.completeLog('${l.id}')">Concluir</button>`:''}
          </div>`).join('')}</div>`
        : `<div class="empty-state" style="padding:1.5rem">
            <p>Nenhum treino registrado hoje.</p>
            <button class="btn btn-fit btn-sm" onclick="FitnessApp.navigate('workouts')">Registrar treino</button>
          </div>`}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.75rem;margin-top:1rem">
        ${quickAction('💪','Registrar Treino','workouts')}
        ${quickAction('🥗','Adicionar Refeição','nutrition')}
        ${quickAction('📊','Ver Progresso','progress')}
        ${quickAction('🤖','Consultar FitBot','fitbot')}
      </div>`;
  }

  function statCard(cls, icon, label, value, unit, pct, color, sub) {
    return `<div class="stat-card ${cls}">
      <div class="stat-label">${icon} ${label}</div>
      <div><span class="stat-value">${value}</span><span class="stat-unit"> ${unit}</span></div>
      <div class="stat-progress"><div class="stat-progress-bar" style="width:${pct}%;background:${color}"></div></div>
      <div class="stat-sub">${sub}</div>
    </div>`;
  }

  function macroRing(label, value, goal, unit, color) {
    const pct = Math.min(100, goal > 0 ? Math.round(value/goal*100) : 0);
    const dash = 2 * Math.PI * 28;
    const offset = dash * (1 - pct/100);
    return `<div style="text-align:center">
      <div style="color:var(--text-muted);font-size:.75rem;margin-bottom:.35rem">${label}</div>
      <div style="position:relative;width:72px;height:72px;margin:0 auto .35rem">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="28" fill="none" stroke="var(--surface-2)" stroke-width="7"/>
          <circle cx="36" cy="36" r="28" fill="none" stroke="${color}" stroke-width="7"
            stroke-dasharray="${dash.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
            stroke-linecap="round" transform="rotate(-90 36 36)"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700">${pct}%</div>
      </div>
      <div style="font-size:.875rem;font-weight:700">${value}${unit}</div>
      <div style="font-size:.7rem;color:var(--text-muted)">/ ${goal}${unit}</div>
    </div>`;
  }

  function quickAction(icon, label, section) {
    return `<button onclick="FitnessApp.navigate('${section}')" style="display:flex;align-items:center;gap:.625rem;padding:.875rem 1rem;background:var(--surface);border:1px solid var(--border-gray);border-radius:var(--radius);cursor:pointer;font-family:inherit;font-size:.875rem;font-weight:500;color:var(--text-2);transition:all .18s;text-align:left;width:100%"
      onmouseover="this.style.background='var(--fit-primary-bg)';this.style.color='var(--fit-primary)'"
      onmouseout="this.style.background='var(--surface)';this.style.color='var(--text-2)'">
      <span style="font-size:1.25rem">${icon}</span>${label}
    </button>`;
  }

  async function addWater(ml) {
    const r = await FitnessAPI.post('/water', { amount_ml: ml });
    if (r.ok) { FitnessApp.toast(`+${ml}ml registrado!`, 'success'); render(); }
    else FitnessApp.toast(r.error || 'Erro', 'error');
  }

  async function completeLog(id) {
    const r = await FitnessAPI.put(`/workout-logs/${id}`, { completed: true });
    if (r.ok) { FitnessApp.toast('Treino concluído! 💪', 'success'); render(); }
  }

  function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  return { init, render, addWater, completeLog };
})();
