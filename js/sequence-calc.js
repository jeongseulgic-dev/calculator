let mode = 'arith';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 6 }); }

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

function fibonacci(n){
  let a = 0, b = 1;
  if (n === 1) return 0;
  for (let i = 2; i < n; i++){ [a, b] = [b, a + b]; }
  return b;
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'arith'){
    const a1 = parseFloat(document.getElementById('sq-a1').value);
    const d = parseFloat(document.getElementById('sq-d').value);
    const n = parseInt(document.getElementById('sq-n').value, 10);
    if (!Number.isFinite(a1) || !Number.isFinite(d) || !Number.isFinite(n) || n < 1){
      fail('첫째항, 공차, n(1 이상)을 입력해 주세요');
      return;
    }
    const an = a1 + (n - 1) * d;
    const sum = n * (a1 + an) / 2;
    const preview = Array.from({ length: Math.min(n, 8) }, (_, i) => fmt(a1 + i * d)).join(', ') + (n > 8 ? ', ...' : '');

    miniScreen.textContent = fmt(an);
    miniScreenSub.textContent = `제 ${n}항`;
    meta.textContent = `a1=${a1}, d=${d}, n=${n}`;
    statBody.innerHTML = `
      <tr><th>수열</th><td>${preview}</td></tr>
      <tr class="stat-highlight"><th>제 ${n}항 (aₙ)</th><td>${fmt(an)}</td></tr>
      <tr class="stat-highlight"><th>첫 ${n}항의 합</th><td>${fmt(sum)}</td></tr>
    `;
    UrlState.sync({ mode, a1, d, n }, URL_DEFAULTS);
  }

  else if (mode === 'geo'){
    const a1 = parseFloat(document.getElementById('sq-ga1').value);
    const r = parseFloat(document.getElementById('sq-r').value);
    const n = parseInt(document.getElementById('sq-gn').value, 10);
    if (!Number.isFinite(a1) || !Number.isFinite(r) || !Number.isFinite(n) || n < 1){
      fail('첫째항, 공비, n(1 이상)을 입력해 주세요');
      return;
    }
    const an = a1 * Math.pow(r, n - 1);
    const sum = r === 1 ? a1 * n : a1 * (1 - Math.pow(r, n)) / (1 - r);
    const infSum = Math.abs(r) < 1 ? a1 / (1 - r) : null;
    const preview = Array.from({ length: Math.min(n, 8) }, (_, i) => fmt(a1 * Math.pow(r, i))).join(', ') + (n > 8 ? ', ...' : '');

    miniScreen.textContent = fmt(an);
    miniScreenSub.textContent = `제 ${n}항`;
    meta.textContent = `a1=${a1}, r=${r}, n=${n}`;
    statBody.innerHTML = `
      <tr><th>수열</th><td>${preview}</td></tr>
      <tr class="stat-highlight"><th>제 ${n}항 (aₙ)</th><td>${fmt(an)}</td></tr>
      <tr class="stat-highlight"><th>첫 ${n}항의 합</th><td>${fmt(sum)}</td></tr>
      ${infSum !== null ? `<tr><th>무한등비급수 합 (|r|&lt;1)</th><td>${fmt(infSum)}</td></tr>` : ''}
    `;
    UrlState.sync({ mode, ga1: a1, r, gn: n }, URL_DEFAULTS);
  }

  else if (mode === 'fib'){
    const n = parseInt(document.getElementById('sq-fn').value, 10);
    if (!Number.isFinite(n) || n < 1 || n > 1000){
      fail('n을 1~1000 사이 정수로 입력해 주세요');
      return;
    }
    const fn = fibonacci(n);
    const preview = Array.from({ length: Math.min(n, 10) }, (_, i) => fmt(fibonacci(i + 1))).join(', ') + (n > 10 ? ', ...' : '');

    miniScreen.textContent = fmt(fn);
    miniScreenSub.textContent = `제 ${n}번째 피보나치 수`;
    meta.textContent = `n=${n}`;
    statBody.innerHTML = `
      <tr><th>수열</th><td>${preview}</td></tr>
      <tr class="stat-highlight"><th>제 ${n}번째 수</th><td>${fmt(fn)}</td></tr>
    `;
    UrlState.sync({ mode, fn: n }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  a1: document.getElementById('sq-a1').defaultValue,
  d: document.getElementById('sq-d').defaultValue,
  n: document.getElementById('sq-n').defaultValue,
  ga1: document.getElementById('sq-ga1').defaultValue,
  r: document.getElementById('sq-r').defaultValue,
  gn: document.getElementById('sq-gn').defaultValue,
  fn: document.getElementById('sq-fn').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.a1) document.getElementById('sq-a1').value = urlParams.a1;
if (urlParams.d) document.getElementById('sq-d').value = urlParams.d;
if (urlParams.n) document.getElementById('sq-n').value = urlParams.n;
if (urlParams.ga1) document.getElementById('sq-ga1').value = urlParams.ga1;
if (urlParams.r) document.getElementById('sq-r').value = urlParams.r;
if (urlParams.gn) document.getElementById('sq-gn').value = urlParams.gn;
if (urlParams.fn) document.getElementById('sq-fn').value = urlParams.fn;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#sq-a1, #sq-d, #sq-n, #sq-ga1, #sq-r, #sq-gn, #sq-fn').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
