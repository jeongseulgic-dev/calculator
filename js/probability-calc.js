let mode = 'two';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 6 }); }
function pct(p){ return fmt(p * 100, 4) + '%'; }

function nCr(n, r){
  let result = 1;
  for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1);
  return Math.round(result);
}

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
  document.getElementById('miniScreen').textContent = '0%';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'two'){
    const pa = parseFloat(document.getElementById('pr-a').value);
    const pb = parseFloat(document.getElementById('pr-b').value);
    if (!Number.isFinite(pa) || !Number.isFinite(pb) || pa < 0 || pa > 1 || pb < 0 || pb > 1){
      fail('두 확률 모두 0~1 사이 값을 입력해 주세요');
      return;
    }
    const both = pa * pb;
    const either = pa + pb - both;
    const onlyA = pa * (1 - pb);
    const onlyB = (1 - pa) * pb;
    const neither = (1 - pa) * (1 - pb);

    miniScreen.textContent = pct(both);
    miniScreenSub.textContent = 'P(A와 B 둘 다)';
    meta.textContent = `P(A)=${pa}, P(B)=${pb}`;
    statBody.innerHTML = `
      <tr><th>P(A)</th><td>${pct(pa)}</td></tr>
      <tr><th>P(B)</th><td>${pct(pb)}</td></tr>
      <tr class="stat-highlight"><th>P(A ∩ B) 둘 다</th><td>${pct(both)}</td></tr>
      <tr class="stat-highlight"><th>P(A ∪ B) 둘 중 하나 이상</th><td>${pct(either)}</td></tr>
      <tr><th>P(A만, B는 아님)</th><td>${pct(onlyA)}</td></tr>
      <tr><th>P(B만, A는 아님)</th><td>${pct(onlyB)}</td></tr>
      <tr><th>P(둘 다 아님)</th><td>${pct(neither)}</td></tr>
    `;
    UrlState.sync({ mode, a: pa, b: pb }, URL_DEFAULTS);
  }

  else if (mode === 'repeat'){
    const p = parseFloat(document.getElementById('pr-p').value);
    const n = parseInt(document.getElementById('pr-n').value, 10);
    const k = parseInt(document.getElementById('pr-k').value, 10);
    if (!Number.isFinite(p) || p < 0 || p > 1 || !Number.isFinite(n) || n < 1 || n > 1000 || !Number.isFinite(k) || k < 0 || k > n){
      fail('확률(0~1), 시행 횟수(1~1000), 성공 횟수(0~시행횟수)를 입력해 주세요');
      return;
    }
    const atLeastOnce = 1 - Math.pow(1 - p, n);
    const exactlyK = nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
    const zero = Math.pow(1 - p, n);

    miniScreen.textContent = pct(atLeastOnce);
    miniScreenSub.textContent = `${n}번 중 최소 1번 성공`;
    meta.textContent = `p=${p}, n=${n}, k=${k}`;
    statBody.innerHTML = `
      <tr><th>1회 성공 확률 (p)</th><td>${pct(p)}</td></tr>
      <tr><th>시행 횟수 (n)</th><td>${fmt(n, 0)}</td></tr>
      <tr class="stat-highlight"><th>최소 1번 성공할 확률</th><td>${pct(atLeastOnce)}</td></tr>
      <tr><th>한 번도 성공 못할 확률</th><td>${pct(zero)}</td></tr>
      <tr class="stat-highlight"><th>정확히 ${k}번 성공할 확률</th><td>${pct(exactlyK)}</td></tr>
    `;
    UrlState.sync({ mode, p, n, k }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  a: document.getElementById('pr-a').defaultValue,
  b: document.getElementById('pr-b').defaultValue,
  p: document.getElementById('pr-p').defaultValue,
  n: document.getElementById('pr-n').defaultValue,
  k: document.getElementById('pr-k').defaultValue
};

const urlParams = UrlState.read();
['a','b','p','n','k'].forEach(key=>{
  const el = document.getElementById('pr-' + key);
  if (urlParams[key] && el) el.value = urlParams[key];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#pr-a, #pr-b, #pr-p, #pr-n, #pr-k').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
