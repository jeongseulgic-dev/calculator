function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:1, minimumFractionDigits:1 }); }

const METHODS = [
  { key:'epley',    label:'Epley' },
  { key:'brzycki',  label:'Brzycki' },
  { key:'lombardi', label:'Lombardi' }
];

const PCT_TABLE = [
  [1,100],[2,95],[3,93],[4,90],[5,87],[6,85],[7,83],[8,80],[9,77],[10,75],[12,70]
];

function calc1RM(formula, weight, reps){
  if (formula === 'epley') return weight * (1 + reps/30);
  if (formula === 'brzycki') return weight * 36 / (37 - reps);
  return weight * Math.pow(reps, 0.10);
}

function recalc(){
  const weight = parseFloat(document.getElementById('o-weight').value);
  const reps = parseFloat(document.getElementById('o-reps').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const grid = document.getElementById('compareGrid');
  const pctBody = document.getElementById('pctBody');
  const meta = document.getElementById('page-meta');

  if (!weight || weight <= 0 || !reps || reps <= 0 || reps >= 37){
    miniScreen.textContent = '0.0 kg';
    miniScreenSub.textContent = '';
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">든 무게와 반복 횟수를 입력해 주세요</div>';
    pctBody.innerHTML = '';
    meta.textContent = '--';
    return;
  }

  const results = METHODS.map(m => ({ ...m, value: calc1RM(m.key, weight, reps) }));
  const avg = results.reduce((sum, r) => sum + r.value, 0) / results.length;

  miniScreen.textContent = fmt1(avg) + ' kg';
  miniScreenSub.textContent = '3개 공식 평균 (참고용)';
  meta.textContent = `${weight}kg × ${reps}회`;

  grid.innerHTML = results.map(r => `
    <div class="method-card">
      <h3>${r.label}</h3>
      <div class="method-row total"><span>추정 1RM</span><span class="val">${fmt1(r.value)} kg</span></div>
    </div>
  `).join('');

  pctBody.innerHTML = PCT_TABLE.map(([rm, pct]) => `
    <tr${rm === 1 ? ' class="stat-highlight"' : ''}><th>${rm}회 (${pct}%)</th><td>${fmt1(avg * pct / 100)} kg</td></tr>
  `).join('');

  UrlState.sync({ weight, reps }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  weight: document.getElementById('o-weight').defaultValue,
  reps: document.getElementById('o-reps').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.weight) document.getElementById('o-weight').value = urlParams.weight;
if (urlParams.reps) document.getElementById('o-reps').value = urlParams.reps;

document.getElementById('o-weight').addEventListener('input', recalc);
document.getElementById('o-reps').addEventListener('input', recalc);

recalc();
