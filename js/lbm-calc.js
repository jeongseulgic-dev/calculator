let gender = 'male';

function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:1, minimumFractionDigits:1 }); }

const METHODS = [
  { key:'boer',  label:'Boer (1984)' },
  { key:'james', label:'James (1976)' },
  { key:'hume',  label:'Hume (1966)' }
];

function calcLBM(formula, gender, weight, height){
  if (formula === 'boer'){
    return gender === 'male'
      ? 0.407*weight + 0.267*height - 19.2
      : 0.252*weight + 0.473*height - 48.3;
  }
  if (formula === 'james'){
    const ratio = weight/height;
    return gender === 'male'
      ? 1.1*weight - 128*ratio*ratio
      : 1.07*weight - 148*ratio*ratio;
  }
  return gender === 'male'
    ? 0.32810*weight + 0.33929*height - 29.5336
    : 0.29569*weight + 0.41813*height - 43.2933;
}

document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    gender = btn.dataset.value;
    recalc();
  });
});

function recalc(){
  const height = parseFloat(document.getElementById('l-height').value);
  const weight = parseFloat(document.getElementById('l-weight').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const grid = document.getElementById('compareGrid');
  const meta = document.getElementById('page-meta');

  if (!height || !weight || height <= 0 || weight <= 0){
    miniScreen.textContent = '0.0 kg';
    miniScreenSub.textContent = '';
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">키·몸무게를 입력해 주세요</div>';
    meta.textContent = '--';
    return;
  }

  const results = METHODS.map(m => {
    const lbm = Math.max(0, calcLBM(m.key, gender, weight, height));
    const bodyFatPct = (weight - lbm) / weight * 100;
    const ratioPct = lbm / weight * 100;
    return { ...m, lbm, bodyFatPct, ratioPct };
  });

  const avgLbm = results.reduce((sum, r) => sum + r.lbm, 0) / results.length;

  miniScreen.textContent = fmt1(avgLbm) + ' kg';
  miniScreenSub.textContent = '3개 공식 평균 (참고용)';
  meta.textContent = `키 ${height}cm · 몸무게 ${weight}kg · ${gender === 'male' ? '남성' : '여성'}`;

  grid.innerHTML = results.map(r => `
    <div class="method-card">
      <h3>${r.label}</h3>
      <div class="method-row"><span>제지방량</span><span class="val">${fmt1(r.lbm)} kg</span></div>
      <div class="method-row"><span>체중 대비 비율</span><span class="val">${fmt1(r.ratioPct)}%</span></div>
      <div class="method-row total"><span>체지방률(역산)</span><span class="val">${fmt1(r.bodyFatPct)}%</span></div>
    </div>
  `).join('');

  UrlState.sync({ gender, height, weight }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  gender: toggleDefault('gender'),
  height: document.getElementById('l-height').defaultValue,
  weight: document.getElementById('l-weight').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.height) document.getElementById('l-height').value = urlParams.height;
if (urlParams.weight) document.getElementById('l-weight').value = urlParams.weight;
if (urlParams.gender) clickToggle('gender', urlParams.gender);

document.getElementById('l-height').addEventListener('input', recalc);
document.getElementById('l-weight').addEventListener('input', recalc);

recalc();
