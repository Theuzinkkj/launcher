/* ===== NUTRITION MODULE ===== */

const Nutrition = (() => {
  const MEAL_LABELS = { cafe_da_manha:'☕ Café da Manhã', almoco:'🍽️ Almoço', jantar:'🌙 Jantar', lanche:'🍎 Lanche', pre_treino:'⚡ Pré-Treino', pos_treino:'🥤 Pós-Treino' };
  const MEAL_ORDER = ['cafe_da_manha','almoco','jantar','lanche','pre_treino','pos_treino'];

  function init() {
    const el = document.getElementById('nutritionDate');
    if (el) el.value = FitnessApp.today();
  }

  async function render() {
    const date = document.getElementById('nutritionDate')?.value || FitnessApp.today();
    const [mealsRes, sumRes] = await Promise.all([
      FitnessAPI.get(`/meals?date=${date}`),
      FitnessAPI.get(`/daily-summary?date=${date}`)
    ]);
    const meals = mealsRes.ok ? mealsRes.data : [];
    const sum = sumRes.ok ? sumRes.data : { calories:0, protein:0, carbs:0, fat:0 };
    const el = document.getElementById('nutritionContent');
    if (!el) return;

    const grouped = {};
    MEAL_ORDER.forEach(t => grouped[t] = []);
    meals.forEach(m => { if (grouped[m.meal_type]) grouped[m.meal_type].push(m); });

    el.innerHTML = `
      <div class="fit-card" style="margin-bottom:1rem">
        <div style="font-size:.9375rem;font-weight:600;margin-bottom:.875rem">📊 Resumo do Dia</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;text-align:center">
          ${macro('🔥','Calorias',Math.round(sum.calories),'kcal','#f97316')}
          ${macro('🥩','Proteína',Math.round(sum.protein),'g','#ef4444')}
          ${macro('🌾','Carbs',Math.round(sum.carbs),'g','#f59e0b')}
          ${macro('🥑','Gordura',Math.round(sum.fat),'g','#10b981')}
        </div>
      </div>
      ${MEAL_ORDER.map(type => {
        const items = grouped[type];
        return `<div style="margin-bottom:1rem">
          <div class="meal-type-label">${MEAL_LABELS[type]}</div>
          ${items.map(buildMealCard).join('')}
          ${!items.length ? `<div style="font-size:.8125rem;color:var(--text-muted);padding:.375rem 0">Nenhuma refeição registrada</div>` : ''}
        </div>`;
      }).join('')}`;
  }

  function macro(icon, label, value, unit, color) {
    return `<div>
      <div style="font-size:1.25rem">${icon}</div>
      <div style="font-size:1.1rem;font-weight:700;color:${color}">${value}</div>
      <div style="font-size:.7rem;color:var(--text-muted)">${unit}</div>
      <div style="font-size:.7rem;color:var(--text-muted)">${label}</div>
    </div>`;
  }

  function buildMealCard(m) {
    const foods = m.food_items || [];
    return `<div class="meal-card">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span class="meal-name">${esc(m.name)}</span>
        <button onclick="Nutrition.deleteMeal('${m.id}')" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:1.1rem">🗑️</button>
      </div>
      <div class="meal-macros">
        <span class="macro-pill cal">🔥 ${Math.round(m.total_calories)} kcal</span>
        <span class="macro-pill prot">P: ${Math.round(m.total_protein)}g</span>
        <span class="macro-pill carb">C: ${Math.round(m.total_carbs)}g</span>
        <span class="macro-pill fat">G: ${Math.round(m.total_fat)}g</span>
      </div>
      ${foods.length ? `<div style="margin-top:.625rem;border-top:1px solid var(--border-gray);padding-top:.5rem">${foods.map(f=>`
        <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-2);padding:.1rem 0">
          <span>${esc(f.name)} <span style="color:var(--text-muted)">${f.quantity}${f.unit}</span></span>
          <span style="color:var(--text-muted)">${Math.round(f.calories)} kcal</span>
        </div>`).join('')}</div>` : ''}
    </div>`;
  }

  function openAddMeal() {
    const date = document.getElementById('nutritionDate')?.value || FitnessApp.today();
    FitnessApp.openModal('Adicionar Refeição', `
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Nome da refeição</label><input type="text" id="mName" class="form-input" placeholder="Ex: Almoço pós-treino"/></div>
        <div class="form-group"><label class="form-label">Tipo</label>
          <select id="mType" class="form-input">
            ${Object.entries(MEAL_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Alimentos</label>
        <div style="display:grid;grid-template-columns:2fr 60px 50px 55px 55px 55px 55px 24px;gap:.25rem;font-size:.65rem;color:var(--text-muted);padding:.25rem .25rem;font-weight:600">
          <span>Alimento</span><span>Qtd</span><span>Un</span><span>kcal</span><span>Prot</span><span>Carb</span><span>Gord</span><span></span>
        </div>
        <div id="foodList">${foodRow()}</div>
        <button type="button" class="btn btn-ghost btn-sm" onclick="Nutrition.addFoodRow()" style="margin-top:.5rem">+ Adicionar alimento</button>
      </div>
      <div class="fit-card" style="margin-top:.75rem;font-size:.875rem">
        <strong>Totais: </strong>
        <span id="totCal">0</span> kcal |
        P: <span id="totProt">0</span>g |
        C: <span id="totCarb">0</span>g |
        G: <span id="totFat">0</span>g
      </div>`,
      [
        { label: 'Cancelar', action: 'FitnessApp.closeModal()' },
        { label: '💾 Salvar Refeição', action: `Nutrition.saveMeal('${date}')`, primary: true }
      ]
    );
    document.getElementById('mName')?.focus();
    document.getElementById('foodList')?.addEventListener('input', updateTotals);
  }

  function foodRow() {
    return `<div class="food-row" style="display:grid;grid-template-columns:2fr 60px 50px 55px 55px 55px 55px 24px;gap:.25rem;margin-bottom:.25rem">
      <input type="text" class="form-input f-name" placeholder="Frango grelhado" style="padding:.35rem .5rem;font-size:.8rem"/>
      <input type="number" class="form-input f-qty" placeholder="100" value="100" min="0" step="1" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <input type="text" class="form-input f-unit" placeholder="g" value="g" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <input type="number" class="form-input f-cal" placeholder="0" min="0" step="0.1" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <input type="number" class="form-input f-prot" placeholder="0" min="0" step="0.1" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <input type="number" class="form-input f-carb" placeholder="0" min="0" step="0.1" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <input type="number" class="form-input f-fat" placeholder="0" min="0" step="0.1" style="padding:.35rem;font-size:.8rem;text-align:center"/>
      <button type="button" onclick="this.parentElement.remove();Nutrition.updateTotals()" style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:1rem;padding:0">×</button>
    </div>`;
  }

  function addFoodRow() {
    const list = document.getElementById('foodList');
    if (list) { list.insertAdjacentHTML('beforeend', foodRow()); list.addEventListener('input', updateTotals); }
  }

  function updateTotals() {
    let cal=0,prot=0,carb=0,fat=0;
    document.querySelectorAll('.food-row').forEach(r => {
      cal+=parseFloat(r.querySelector('.f-cal')?.value)||0;
      prot+=parseFloat(r.querySelector('.f-prot')?.value)||0;
      carb+=parseFloat(r.querySelector('.f-carb')?.value)||0;
      fat+=parseFloat(r.querySelector('.f-fat')?.value)||0;
    });
    const s = v => document.getElementById(v);
    if(s('totCal')) s('totCal').textContent=Math.round(cal);
    if(s('totProt')) s('totProt').textContent=Math.round(prot);
    if(s('totCarb')) s('totCarb').textContent=Math.round(carb);
    if(s('totFat')) s('totFat').textContent=Math.round(fat);
  }

  async function saveMeal(date) {
    const name = document.getElementById('mName')?.value.trim();
    if (!name) { FitnessApp.toast('Digite o nome da refeição.','error'); return; }
    const food_items = [...document.querySelectorAll('.food-row')].map(r=>({
      name: r.querySelector('.f-name')?.value.trim(),
      quantity: parseFloat(r.querySelector('.f-qty')?.value)||100,
      unit: r.querySelector('.f-unit')?.value||'g',
      calories: parseFloat(r.querySelector('.f-cal')?.value)||0,
      protein: parseFloat(r.querySelector('.f-prot')?.value)||0,
      carbs: parseFloat(r.querySelector('.f-carb')?.value)||0,
      fat: parseFloat(r.querySelector('.f-fat')?.value)||0
    })).filter(f=>f.name);
    const totals = food_items.reduce((a,f)=>({ calories:a.calories+f.calories, protein:a.protein+f.protein, carbs:a.carbs+f.carbs, fat:a.fat+f.fat }),{ calories:0,protein:0,carbs:0,fat:0 });
    const body = { name, meal_type: document.getElementById('mType')?.value||'lanche', date, food_items, total_calories:totals.calories, total_protein:totals.protein, total_carbs:totals.carbs, total_fat:totals.fat };
    const r = await FitnessAPI.post('/meals', body);
    if (r.ok) { FitnessApp.toast('Refeição registrada!','success'); FitnessApp.closeModal(); render(); }
    else FitnessApp.toast(r.error||'Erro.','error');
  }

  async function deleteMeal(id) {
    if (!confirm('Excluir esta refeição?')) return;
    const r = await FitnessAPI.del(`/meals/${id}`);
    if (r.ok) { FitnessApp.toast('Refeição excluída.','info'); render(); }
    else FitnessApp.toast(r.error||'Erro.','error');
  }

  function esc(s){ return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'):''; }

  return { init, render, openAddMeal, addFoodRow, updateTotals, saveMeal, deleteMeal };
})();
