/* ===== PROFILE MODULE ===== */

const Profile = (() => {
  let _profile = null;
  const DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const RESTRICTIONS = ['Lactose','Glúten','Vegano','Vegetariano','Sem açúcar','Sem frutos do mar','Sem nozes','Low carb'];

  async function init() {
    await load();
    if (!document.getElementById('sec-profile')?.classList.contains('hidden')) render();
  }

  async function load() {
    const r = await FitnessAPI.get('/profile');
    if (r.ok) _profile = r.data;
  }

  function render() { document.getElementById('profileContent').innerHTML = buildForm(); }

  function buildForm() {
    const p = _profile || {};
    const availDays = p.available_days || [];
    const restrictions = p.food_restrictions || [];
    return `
      <div style="max-width:720px">
        <div class="fit-card" style="margin-bottom:1rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">👤 Dados Pessoais</h3>
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label">Nome</label><input type="text" id="profName" class="form-input" value="${esc(p.name||'')}" placeholder="Seu nome"/></div>
            <div class="form-group"><label class="form-label">Idade</label><input type="number" id="profAge" class="form-input" value="${p.age||''}" placeholder="Anos" min="10" max="100"/></div>
            <div class="form-group"><label class="form-label">Sexo</label>
              <select id="profSex" class="form-input">
                <option value="">Selecione</option>
                <option value="masculino" ${p.sex==='masculino'?'selected':''}>Masculino</option>
                <option value="feminino" ${p.sex==='feminino'?'selected':''}>Feminino</option>
                <option value="outro" ${p.sex==='outro'?'selected':''}>Outro</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Altura (cm)</label><input type="number" id="profHeight" class="form-input" value="${p.height||''}" placeholder="Ex: 175" min="100" max="250"/></div>
            <div class="form-group"><label class="form-label">Peso atual (kg)</label><input type="number" id="profWeight" class="form-input" value="${p.weight||''}" placeholder="Ex: 75" min="30" max="300" step="0.1"/></div>
            <div class="form-group"><label class="form-label">Nível de experiência</label>
              <select id="profExp" class="form-input">
                <option value="iniciante" ${p.experience_level==='iniciante'?'selected':''}>Iniciante</option>
                <option value="intermediario" ${p.experience_level==='intermediario'?'selected':''}>Intermediário</option>
                <option value="avancado" ${p.experience_level==='avancado'?'selected':''}>Avançado</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Objetivo</label>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.35rem">
              ${['emagrecimento','hipertrofia','manutencao','performance'].map(g=>`
                <button type="button" class="day-pill ${p.goal===g?'active':''}" onclick="Profile.toggleGoal('${g}',this)" id="goal_${g}">
                  ${{emagrecimento:'Emagrecimento',hipertrofia:'Hipertrofia',manutencao:'Manutenção',performance:'Performance'}[g]}
                </button>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Dias disponíveis para treino</label>
            <div class="day-pills" id="dayPills">
              ${DAYS.map((d,i)=>`<button type="button" class="day-pill ${availDays.includes(d)?'active':''}" onclick="Profile.toggleDay('${d}',this)">${d}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="fit-card" style="margin-bottom:1rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🎯 Metas Diárias</h3>
          <div class="form-grid-2">
            <div class="form-group"><label class="form-label">Calorias (kcal)</label><input type="number" id="profCal" class="form-input" value="${p.daily_calorie_goal||2000}" min="1000" max="6000"/></div>
            <div class="form-group"><label class="form-label">Proteína (g)</label><input type="number" id="profProt" class="form-input" value="${p.daily_protein_goal||150}" min="50" max="500"/></div>
            <div class="form-group"><label class="form-label">Carboidratos (g)</label><input type="number" id="profCarb" class="form-input" value="${p.daily_carb_goal||250}" min="50" max="800"/></div>
            <div class="form-group"><label class="form-label">Gordura (g)</label><input type="number" id="profFat" class="form-input" value="${p.daily_fat_goal||65}" min="20" max="300"/></div>
            <div class="form-group"><label class="form-label">Água (L)</label><input type="number" id="profWater" class="form-input" value="${p.daily_water_goal||2.5}" min="1" max="8" step="0.5"/></div>
          </div>
        </div>

        <div class="fit-card" style="margin-bottom:1.5rem">
          <h3 style="font-size:1rem;font-weight:700;margin-bottom:1rem">🥗 Restrições Alimentares</h3>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem" id="restrictionTags">
            ${RESTRICTIONS.map(r=>`<button type="button" class="restriction-tag ${restrictions.includes(r)?'active':''}" onclick="Profile.toggleRestriction('${r}',this)">${r}</button>`).join('')}
          </div>
        </div>

        <div style="display:flex;gap:.75rem;flex-wrap:wrap">
          <button class="btn btn-fit" onclick="Profile.save()">💾 Salvar Perfil</button>
          <button class="btn btn-ghost" onclick="window.location.href='/'">← Voltar ao Início</button>
          <button class="btn btn-danger btn-sm" onclick="Profile.logout()" style="margin-left:auto">Sair da conta</button>
        </div>
      </div>`;
  }

  function toggleGoal(goal, btn) {
    document.querySelectorAll('[id^="goal_"]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function toggleDay(day, btn) { btn.classList.toggle('active'); }

  function toggleRestriction(r, btn) { btn.classList.toggle('active'); }

  async function save() {
    const goal = document.querySelector('[id^="goal_"].active')?.id.replace('goal_','') || _profile?.goal;
    const availDays = [...document.querySelectorAll('#dayPills .day-pill.active')].map(b=>b.textContent.trim());
    const restrictions = [...document.querySelectorAll('#restrictionTags .restriction-tag.active')].map(b=>b.textContent.trim());
    const body = {
      name: document.getElementById('profName')?.value.trim(),
      age: parseInt(document.getElementById('profAge')?.value)||null,
      sex: document.getElementById('profSex')?.value||null,
      height: parseFloat(document.getElementById('profHeight')?.value)||null,
      weight: parseFloat(document.getElementById('profWeight')?.value)||null,
      experience_level: document.getElementById('profExp')?.value,
      goal, available_days: availDays, food_restrictions: restrictions,
      daily_calorie_goal: parseInt(document.getElementById('profCal')?.value)||2000,
      daily_protein_goal: parseInt(document.getElementById('profProt')?.value)||150,
      daily_carb_goal: parseInt(document.getElementById('profCarb')?.value)||250,
      daily_fat_goal: parseInt(document.getElementById('profFat')?.value)||65,
      daily_water_goal: parseFloat(document.getElementById('profWater')?.value)||2.5
    };
    const r = await FitnessAPI.put('/profile', body);
    if (r.ok) { _profile = r.data; FitnessApp.toast('Perfil salvo!', 'success'); }
    else FitnessApp.toast(r.error || 'Erro ao salvar.', 'error');
  }

  function logout() {
    if (!confirm('Deseja sair do AtlasFit?')) return;
    localStorage.removeItem('atlas_token');
    sessionStorage.clear();
    window.location.href = '/';
  }

  function esc(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

  return { init, render, save, toggleGoal, toggleDay, toggleRestriction, logout };
})();
