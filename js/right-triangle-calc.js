let mode = 'ab';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== mode);
    });
    recalc();
  });
});

function fail(msg){
  document.getElementById('miniScreen').textContent = '0';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function showResult(a, b, c, meta){
  const A = toDeg(Math.asin(a / c));
  const B = 90 - A;
  const area = 0.5 * a * b;
  const perimeter = a + b + c;
  const h = a * b / c;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const metaEl = document.getElementById('page-meta');

  miniScreen.textContent = fmt(c);
  miniScreenSub.textContent = '빗변 (c)';
  metaEl.textContent = meta;

  statBody.innerHTML = `
    <tr><th>밑변 a / 높이 b</th><td>${fmt(a)} / ${fmt(b)}</td></tr>
    <tr class="stat-highlight"><th>빗변 (c)</th><td>${fmt(c)}</td></tr>
    <tr><th>각 A (a의 대각) / 각 B (b의 대각)</th><td>${fmt(A, 2)}° / ${fmt(B, 2)}°</td></tr>
    <tr class="stat-highlight"><th>넓이</th><td>${fmt(area)}</td></tr>
    <tr><th>둘레</th><td>${fmt(perimeter)}</td></tr>
    <tr><th>빗변에 내린 높이 (h)</th><td>${fmt(h)}</td></tr>
  `;
}

function recalc(){
  if (mode === 'ab'){
    const a = parseFloat(document.getElementById('rt-a').value);
    const b = parseFloat(document.getElementById('rt-b').value);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0){
      fail('두 변(0보다 큼)을 입력해 주세요');
      return;
    }
    const c = Math.sqrt(a * a + b * b);
    showResult(a, b, c, `a=${a}, b=${b} → c 계산`);
    UrlState.sync({ mode, a, b }, URL_DEFAULTS);
  }

  else if (mode === 'ac'){
    const a = parseFloat(document.getElementById('rt-ca').value);
    const c = parseFloat(document.getElementById('rt-cc').value);
    if (!Number.isFinite(a) || !Number.isFinite(c) || a <= 0 || c <= 0 || a >= c){
      fail('한 변과 빗변(빗변이 더 큼)을 입력해 주세요');
      return;
    }
    const b = Math.sqrt(c * c - a * a);
    showResult(a, b, c, `a=${a}, c=${c} → b 계산`);
    UrlState.sync({ mode, ca: a, cc: c }, URL_DEFAULTS);
  }

  else if (mode === 'aA'){
    const a = parseFloat(document.getElementById('rt-aa').value);
    const A = parseFloat(document.getElementById('rt-aA').value);
    if (!Number.isFinite(a) || !Number.isFinite(A) || a <= 0 || A <= 0 || A >= 90){
      fail('변(0보다 큼)과 각(0~90도 사이)을 입력해 주세요');
      return;
    }
    const c = a / Math.sin(toRad(A));
    const b = a / Math.tan(toRad(A));
    showResult(a, b, c, `a=${a}, A=${A}° → b, c 계산`);
    UrlState.sync({ mode, aa: a, aA: A }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  a: document.getElementById('rt-a').defaultValue,
  b: document.getElementById('rt-b').defaultValue,
  ca: document.getElementById('rt-ca').defaultValue,
  cc: document.getElementById('rt-cc').defaultValue,
  aa: document.getElementById('rt-aa').defaultValue,
  aA: document.getElementById('rt-aA').defaultValue
};

const urlParams = UrlState.read();
[['a','rt-a'],['b','rt-b'],['ca','rt-ca'],['cc','rt-cc'],['aa','rt-aa'],['aA','rt-aA']].forEach(([k, id])=>{
  if (urlParams[k]) document.getElementById(id).value = urlParams[k];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#rt-a, #rt-b, #rt-ca, #rt-cc, #rt-aa, #rt-aA').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
