let mode = 'simplify';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:6 }); }

function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a || 1; }

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

  if (mode === 'simplify'){
    const a = parseFloat(document.getElementById('rt-a').value);
    const b = parseFloat(document.getElementById('rt-b').value);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || b === 0){
      miniScreen.textContent = '0:0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0이 아닌 두 값을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const g = gcd(a, b);
    const sa = a / g, sb = b / g;
    miniScreen.textContent = `${fmt(sa)} : ${fmt(sb)}`;
    miniScreenSub.textContent = '기약비';
    meta.textContent = `${a} : ${b} 단순화`;
    statBody.innerHTML = `
      <tr><th>입력 비율</th><td>${fmt(a)} : ${fmt(b)}</td></tr>
      <tr class="stat-highlight"><th>기약비</th><td>${fmt(sa)} : ${fmt(sb)}</td></tr>
      <tr><th>소수 비율 (A/B)</th><td>${fmt(a/b)}</td></tr>
    `;
    UrlState.sync({ mode, a, b }, URL_DEFAULTS);
  }

  else if (mode === 'solve'){
    const a = parseFloat(document.getElementById('rt-sa').value);
    const b = parseFloat(document.getElementById('rt-sb').value);
    const c = parseFloat(document.getElementById('rt-sc').value);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">A, B, C를 입력해 주세요 (A는 0이 아니어야 함)</td></tr>';
      meta.textContent = '--';
      return;
    }
    const d = b * c / a;
    miniScreen.textContent = fmt(d);
    miniScreenSub.textContent = `${a}:${b} = ${c}:${fmt(d)}`;
    meta.textContent = `${a}:${b} = ${c}:?`;
    statBody.innerHTML = `
      <tr><th>비례식</th><td>${a} : ${b} = ${c} : ?</td></tr>
      <tr class="stat-highlight"><th>구하는 값</th><td>${fmt(d)}</td></tr>
    `;
    UrlState.sync({ mode, sa: a, sb: b, sc: c }, URL_DEFAULTS);
  }

  else if (mode === 'scale'){
    const a = parseFloat(document.getElementById('rt-ka').value);
    const b = parseFloat(document.getElementById('rt-kb').value);
    const k = parseFloat(document.getElementById('rt-k').value);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(k) || k <= 0){
      miniScreen.textContent = '0:0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">비율(A, B)과 0보다 큰 배율(k)을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const sa = a * k, sb = b * k;
    const label = k > 1 ? '확대' : k < 1 ? '축소' : '동일';
    miniScreen.textContent = `${fmt(sa)} : ${fmt(sb)}`;
    miniScreenSub.textContent = `${a}:${b}를 ${fmt(k)}배 ${label}`;
    meta.textContent = `${a}:${b} × ${k}`;
    statBody.innerHTML = `
      <tr><th>원래 비율</th><td>${fmt(a)} : ${fmt(b)}</td></tr>
      <tr><th>배율</th><td>${fmt(k)}배 (${label})</td></tr>
      <tr class="stat-highlight"><th>결과 비율</th><td>${fmt(sa)} : ${fmt(sb)}</td></tr>
    `;
    UrlState.sync({ mode, ka: a, kb: b, k }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  a: document.getElementById('rt-a').defaultValue,
  b: document.getElementById('rt-b').defaultValue,
  sa: document.getElementById('rt-sa').defaultValue,
  sb: document.getElementById('rt-sb').defaultValue,
  sc: document.getElementById('rt-sc').defaultValue,
  ka: document.getElementById('rt-ka').defaultValue,
  kb: document.getElementById('rt-kb').defaultValue,
  k: document.getElementById('rt-k').defaultValue
};

const urlParams = UrlState.read();
['a','b','sa','sb','sc','ka','kb','k'].forEach(key=>{
  const el = document.getElementById('rt-' + key);
  if (urlParams[key] && el) el.value = urlParams[key];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#rt-a, #rt-b, #rt-sa, #rt-sb, #rt-sc, #rt-ka, #rt-kb, #rt-k').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
