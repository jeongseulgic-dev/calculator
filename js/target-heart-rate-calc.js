const FORMULA_LABEL = { hf: 'Haskell & Fox (220−나이)', tanaka: 'Tanaka (208−0.7×나이)' };

const ZONES = [
  { n: 1, label: '준비운동·회복', lo: 50, hi: 60 },
  { n: 2, label: '지방 연소·유산소 기초', lo: 60, hi: 70 },
  { n: 3, label: '유산소 지구력', lo: 70, hi: 80 },
  { n: 4, label: '무산소 능력', lo: 80, hi: 90 },
  { n: 5, label: '최고 강도', lo: 90, hi: 100 }
];

function calcMaxHR(formula, age){
  return formula === 'tanaka' ? 208 - 0.7*age : 220 - age;
}

function zoneBpm(maxHR, restHR, pct){
  return restHR
    ? Math.round((maxHR - restHR) * pct/100 + restHR)
    : Math.round(maxHR * pct/100);
}

document.querySelectorAll('.seg-toggle[data-target="formula"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="formula"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function recalc(){
  const age = parseFloat(document.getElementById('h-age').value);
  const restRaw = document.getElementById('h-rest').value;
  const restHR = restRaw ? parseFloat(restRaw) : 0;
  const formula = toggleDefault('formula');

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const zoneBody = document.getElementById('zoneBody');
  const meta = document.getElementById('page-meta');

  if (!age || age <= 0){
    miniScreen.textContent = '0 bpm';
    miniScreenSub.textContent = '';
    zoneBody.innerHTML = '';
    meta.textContent = '--';
    return;
  }

  const maxHR = calcMaxHR(formula, age);
  const useKarvonen = restHR > 0;

  miniScreen.textContent = Math.round(maxHR) + ' bpm';
  miniScreenSub.textContent = FORMULA_LABEL[formula] + ' 공식';
  meta.textContent = `${age}세 · ${useKarvonen ? 'Karvonen 방식(안정시 ' + restHR + 'bpm)' : '%최대심박수 방식'}`;

  zoneBody.innerHTML = ZONES.map(z => `
    <tr><th>구간 ${z.n} · ${z.label} (${z.lo}~${z.hi}%)</th><td>${zoneBpm(maxHR, restHR, z.lo)} ~ ${zoneBpm(maxHR, restHR, z.hi)} bpm</td></tr>
  `).join('');

  UrlState.sync({ age, rest: restRaw || '', formula }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  age: document.getElementById('h-age').defaultValue,
  rest: '',
  formula: toggleDefault('formula')
};

const urlParams = UrlState.read();
if (urlParams.age) document.getElementById('h-age').value = urlParams.age;
if (urlParams.rest) document.getElementById('h-rest').value = urlParams.rest;
if (urlParams.formula) clickToggle('formula', urlParams.formula);

document.getElementById('h-age').addEventListener('input', recalc);
document.getElementById('h-rest').addEventListener('input', recalc);

recalc();
