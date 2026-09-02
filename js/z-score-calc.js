let mode = 'toZ';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 6 }); }

function normalPDF(z){ return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

function normalCDF(z){
  const sign = z < 0 ? -1 : 1;
  const az = Math.abs(z);
  const t = 1 / (1 + 0.2316419 * az);
  const b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429;
  const poly = b1 * t + b2 * t ** 2 + b3 * t ** 3 + b4 * t ** 4 + b5 * t ** 5;
  const cdf = 1 - normalPDF(az) * poly;
  return sign === 1 ? cdf : 1 - cdf;
}

function pct(p){ return fmt(p * 100, 4) + '%'; }

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

function recalc(){
  const statBody = document.getElementById('statBody');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const meta = document.getElementById('page-meta');

  if (mode === 'toZ'){
    const x = parseFloat(document.getElementById('z-x').value);
    const mu = parseFloat(document.getElementById('z-mu').value);
    const sigma = parseFloat(document.getElementById('z-sigma').value);
    if (!Number.isFinite(x) || !Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0){
      fail('원점수, 평균, 표준편차(0보다 큼)를 입력해 주세요');
      return;
    }
    const z = (x - mu) / sigma;
    miniScreen.textContent = fmt(z);
    miniScreenSub.textContent = 'Z-점수';
    meta.textContent = `x=${x}, μ=${mu}, σ=${sigma}`;
    statBody.innerHTML = `
      <tr><th>원점수 (x)</th><td>${fmt(x)}</td></tr>
      <tr><th>평균 (μ)</th><td>${fmt(mu)}</td></tr>
      <tr><th>표준편차 (σ)</th><td>${fmt(sigma)}</td></tr>
      <tr class="stat-highlight"><th>Z-점수</th><td>${fmt(z)}</td></tr>
    `;
    UrlState.sync({ mode, x, mu, sigma }, URL_DEFAULTS);
  }

  else if (mode === 'toProb'){
    const z = parseFloat(document.getElementById('z-z').value);
    if (!Number.isFinite(z)){
      fail('Z-점수를 입력해 주세요');
      return;
    }
    const below = normalCDF(z);
    const above = 1 - below;
    const zeroToZ = Math.abs(below - 0.5);
    const between = 2 * normalCDF(Math.abs(z)) - 1;
    const outside = 1 - between;
    miniScreen.textContent = pct(below);
    miniScreenSub.textContent = `P(X < ${z})`;
    meta.textContent = `Z=${z}`;
    statBody.innerHTML = `
      <tr class="stat-highlight"><th>P(X &lt; Z)</th><td>${pct(below)}</td></tr>
      <tr class="stat-highlight"><th>P(X &gt; Z)</th><td>${pct(above)}</td></tr>
      <tr><th>P(0과 Z 사이)</th><td>${pct(zeroToZ)}</td></tr>
      <tr><th>P(−Z &lt; X &lt; Z)</th><td>${pct(between)}</td></tr>
      <tr><th>P(X &lt; −Z 또는 X &gt; Z)</th><td>${pct(outside)}</td></tr>
    `;
    UrlState.sync({ mode, z }, URL_DEFAULTS);
  }

  else if (mode === 'between'){
    let z1 = parseFloat(document.getElementById('z-z1').value);
    let z2 = parseFloat(document.getElementById('z-z2').value);
    if (!Number.isFinite(z1) || !Number.isFinite(z2)){
      fail('두 Z-점수를 입력해 주세요');
      return;
    }
    if (z1 > z2) [z1, z2] = [z2, z1];
    const p = normalCDF(z2) - normalCDF(z1);
    miniScreen.textContent = pct(p);
    miniScreenSub.textContent = `P(${fmt(z1)} < X < ${fmt(z2)})`;
    meta.textContent = `Z1=${z1}, Z2=${z2}`;
    statBody.innerHTML = `
      <tr><th>왼쪽 경계 (Z1)</th><td>${fmt(z1)}</td></tr>
      <tr><th>오른쪽 경계 (Z2)</th><td>${fmt(z2)}</td></tr>
      <tr class="stat-highlight"><th>P(Z1 &lt; X &lt; Z2)</th><td>${pct(p)}</td></tr>
    `;
    UrlState.sync({ mode, z1, z2 }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  x: document.getElementById('z-x').defaultValue,
  mu: document.getElementById('z-mu').defaultValue,
  sigma: document.getElementById('z-sigma').defaultValue,
  z: document.getElementById('z-z').defaultValue,
  z1: document.getElementById('z-z1').defaultValue,
  z2: document.getElementById('z-z2').defaultValue
};

const urlParams = UrlState.read();
['x','mu','sigma','z','z1','z2'].forEach(k=>{
  const el = document.getElementById('z-' + k);
  if (urlParams[k] && el) el.value = urlParams[k];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#z-x, #z-mu, #z-sigma, #z-z, #z-z1, #z-z2').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
