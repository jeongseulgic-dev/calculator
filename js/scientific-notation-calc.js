let mode = 'toSci';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 8 }); }

function toSci(x){
  if (x === 0) return { a: 0, n: 0 };
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  let n = Math.floor(Math.log10(ax));
  let a = ax / Math.pow(10, n);
  if (a >= 10){ a /= 10; n += 1; }
  if (a < 1){ a *= 10; n -= 1; }
  return { a: sign * a, n };
}

function toEngineering(x){
  if (x === 0) return { a: 0, n: 0 };
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const n0 = Math.floor(Math.log10(ax));
  let n = Math.floor(n0 / 3) * 3;
  let a = ax / Math.pow(10, n);
  while (a >= 1000){ a /= 1000; n += 3; }
  while (a < 1){ a *= 1000; n -= 3; }
  return { a: sign * a, n };
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

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'toSci'){
    const x = parseFloat(document.getElementById('sn-x').value);
    if (!Number.isFinite(x)){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">숫자를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const { a, n } = toSci(x);
    const sciStr = `${fmt(a, 6)} × 10${superscript(n)}`;
    const eStr = `${fmt(a, 6)}E${n >= 0 ? '+' : ''}${n}`;
    const eng = toEngineering(x);
    const engStr = `${fmt(eng.a, 6)} × 10${superscript(eng.n)}`;
    miniScreen.textContent = sciStr;
    miniScreenSub.textContent = `일반 표기 ${fmt(x)}`;
    meta.textContent = `${fmt(x)} → 과학적 표기법`;
    statBody.innerHTML = `
      <tr><th>일반 표기</th><td>${fmt(x)}</td></tr>
      <tr class="stat-highlight"><th>과학적 표기법</th><td>${sciStr}</td></tr>
      <tr><th>E 표기법</th><td>${eStr}</td></tr>
      <tr><th>공학용 표기법</th><td>${engStr}</td></tr>
    `;
    UrlState.sync({ mode, x }, URL_DEFAULTS);
  }

  else if (mode === 'fromSci'){
    const a = parseFloat(document.getElementById('sn-a').value);
    const n = parseFloat(document.getElementById('sn-n').value);
    if (!Number.isFinite(a) || !Number.isFinite(n)){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">계수(a)와 지수(n)를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const result = a * Math.pow(10, n);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${fmt(a)} × 10${superscript(n)}`;
    meta.textContent = `${fmt(a)}×10^${n} → 일반 표기`;
    statBody.innerHTML = `
      <tr><th>과학적 표기법</th><td>${fmt(a)} × 10${superscript(n)}</td></tr>
      <tr class="stat-highlight"><th>일반 표기</th><td>${fmt(result)}</td></tr>
    `;
    UrlState.sync({ mode, a, n }, URL_DEFAULTS);
  }
}

function superscript(n){
  const map = { '-':'⁻', '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹' };
  return String(n).split('').map(c => map[c] || c).join('');
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  x: document.getElementById('sn-x').defaultValue,
  a: document.getElementById('sn-a').defaultValue,
  n: document.getElementById('sn-n').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('sn-x').value = urlParams.x;
if (urlParams.a) document.getElementById('sn-a').value = urlParams.a;
if (urlParams.n) document.getElementById('sn-n').value = urlParams.n;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#sn-x, #sn-a, #sn-n').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
