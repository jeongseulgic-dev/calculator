let mode = 'y';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 8 }); }

document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      const modes = f.dataset.mode.split(',');
      f.classList.toggle('hidden', !modes.includes(mode));
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

function recalc(){
  const x = parseFloat(document.getElementById('l-x').value);
  const base = parseFloat(document.getElementById('l-base').value);
  const y = parseFloat(document.getElementById('l-y').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  const baseLabel = (b) => Math.abs(b - Math.E) < 1e-9 ? 'e (자연로그)' : b;

  if (mode === 'y'){
    if (!Number.isFinite(x) || !Number.isFinite(base) || x <= 0 || base <= 0 || base === 1){
      fail('진수는 0보다 큰 수, 밑은 1이 아닌 양수를 입력해 주세요');
      return;
    }
    const result = Math.log(x) / Math.log(base);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `log base ${baseLabel(base)} 의 ${x}`;
    meta.textContent = `log_${base}(${x}) = ?`;
    statBody.innerHTML = `
      <tr><th>계산식</th><td>log<sub>${baseLabel(base)}</sub>(${x})</td></tr>
      <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
      <tr><th>검산</th><td>${baseLabel(base)}^${fmt(result)} ≈ ${fmt(Math.pow(base, result))}</td></tr>
    `;
    UrlState.sync({ mode, x, base }, URL_DEFAULTS);
  }

  else if (mode === 'x'){
    if (!Number.isFinite(base) || !Number.isFinite(y) || base <= 0 || base === 1){
      fail('밑(1이 아닌 양수)과 결과값을 입력해 주세요');
      return;
    }
    const result = Math.pow(base, y);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${baseLabel(base)}^${y}`;
    meta.textContent = `log_${base}(?) = ${y}`;
    statBody.innerHTML = `
      <tr><th>방정식</th><td>log<sub>${baseLabel(base)}</sub>(x) = ${y}</td></tr>
      <tr class="stat-highlight"><th>진수 (x)</th><td>${fmt(result)}</td></tr>
    `;
    UrlState.sync({ mode, base, y }, URL_DEFAULTS);
  }

  else if (mode === 'base'){
    if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y === 0){
      fail('진수(0보다 큰 수)와 0이 아닌 결과값을 입력해 주세요');
      return;
    }
    const result = Math.pow(x, 1 / y);
    if (!Number.isFinite(result) || result <= 0 || result === 1){
      fail('이 조건을 만족하는 유효한 밑(1이 아닌 양수)이 없습니다');
      return;
    }
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${x}의 ${fmt(1/y, 4)}제곱근`;
    meta.textContent = `log_?(${x}) = ${y}`;
    statBody.innerHTML = `
      <tr><th>방정식</th><td>log<sub>x</sub>(${x}) = ${y}</td></tr>
      <tr class="stat-highlight"><th>밑 (x)</th><td>${fmt(result)}</td></tr>
    `;
    UrlState.sync({ mode, x, y }, URL_DEFAULTS);
  }
}

document.getElementById('l-base-e').addEventListener('click', ()=>{
  document.getElementById('l-base').value = Math.E;
  recalc();
});

const URL_DEFAULTS = {
  mode: toggleDefault('solve'),
  x: document.getElementById('l-x').defaultValue,
  base: document.getElementById('l-base').defaultValue,
  y: document.getElementById('l-y').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('l-x').value = urlParams.x;
if (urlParams.base) document.getElementById('l-base').value = urlParams.base;
if (urlParams.y) document.getElementById('l-y').value = urlParams.y;
if (urlParams.mode) clickToggle('solve', urlParams.mode);

document.querySelectorAll('#l-x, #l-base, #l-y').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
