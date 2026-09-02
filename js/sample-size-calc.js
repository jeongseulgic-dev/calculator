let mode = 'size';

const Z_TABLE = { '80':1.282, '85':1.440, '90':1.645, '95':1.960, '98':2.326, '99':2.576, '99.9':3.291 };

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

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
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'size'){
    const level = document.getElementById('ss-level').value;
    const marginPct = parseFloat(document.getElementById('ss-margin').value);
    const propPct = parseFloat(document.getElementById('ss-prop').value);
    const popRaw = document.getElementById('ss-pop').value.trim();
    const pop = popRaw ? parseFloat(popRaw) : null;

    if (!Number.isFinite(marginPct) || marginPct <= 0 || !Number.isFinite(propPct) || propPct <= 0 || propPct >= 100){
      fail('오차범위(0보다 큼)와 모집단 비율(0~100% 사이)을 입력해 주세요');
      return;
    }

    const z = Z_TABLE[level];
    const e = marginPct / 100;
    const p = propPct / 100;
    const n0 = (z * z * p * (1 - p)) / (e * e);
    let n = n0;
    if (pop && pop > 0){
      n = n0 / (1 + (n0 - 1) / pop);
    }
    const nRounded = Math.ceil(n);

    miniScreen.textContent = fmt(nRounded, 0);
    miniScreenSub.textContent = '필요한 최소 표본크기';
    meta.textContent = `신뢰수준 ${level}%, 오차범위 ±${marginPct}%`;
    statBody.innerHTML = `
      <tr><th>신뢰수준</th><td>${level}% (Z=${z})</td></tr>
      <tr><th>오차범위</th><td>±${fmt(marginPct)}%</td></tr>
      <tr><th>모집단 비율(추정)</th><td>${fmt(propPct)}%</td></tr>
      <tr><th>모집단 크기</th><td>${pop ? fmt(pop, 0) : '무제한'}</td></tr>
      <tr class="stat-highlight"><th>필요한 표본크기</th><td>${fmt(nRounded, 0)}명</td></tr>
    `;
    UrlState.sync({ mode, level, margin: marginPct, prop: propPct, pop: popRaw }, URL_DEFAULTS);
  }

  else if (mode === 'margin'){
    const level = document.getElementById('ss-level2').value;
    const n = parseFloat(document.getElementById('ss-n').value);
    const propPct = parseFloat(document.getElementById('ss-prop2').value);
    const popRaw = document.getElementById('ss-pop2').value.trim();
    const pop = popRaw ? parseFloat(popRaw) : null;

    if (!Number.isFinite(n) || n <= 0 || !Number.isFinite(propPct) || propPct <= 0 || propPct >= 100){
      fail('표본크기(0보다 큼)와 모집단 비율(0~100% 사이)을 입력해 주세요');
      return;
    }
    if (pop && pop > 0 && n >= pop){
      fail('표본크기는 모집단 크기보다 작아야 합니다');
      return;
    }

    const z = Z_TABLE[level];
    const p = propPct / 100;
    let marginOfError;
    if (pop && pop > 0){
      marginOfError = z * Math.sqrt((p * (1 - p) * (pop - n)) / (n * (pop - 1)));
    } else {
      marginOfError = z * Math.sqrt(p * (1 - p) / n);
    }
    const marginPct = marginOfError * 100;

    miniScreen.textContent = `±${fmt(marginPct)}%`;
    miniScreenSub.textContent = '오차범위';
    meta.textContent = `신뢰수준 ${level}%, n=${n}`;
    statBody.innerHTML = `
      <tr><th>신뢰수준</th><td>${level}% (Z=${z})</td></tr>
      <tr><th>표본크기 (n)</th><td>${fmt(n, 0)}</td></tr>
      <tr><th>모집단 비율(추정)</th><td>${fmt(propPct)}%</td></tr>
      <tr><th>모집단 크기</th><td>${pop ? fmt(pop, 0) : '무제한'}</td></tr>
      <tr class="stat-highlight"><th>오차범위</th><td>±${fmt(marginPct)}%</td></tr>
    `;
    UrlState.sync({ mode, level2: level, n, prop2: propPct, pop2: popRaw }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  level: document.getElementById('ss-level').value,
  margin: document.getElementById('ss-margin').defaultValue,
  prop: document.getElementById('ss-prop').defaultValue,
  pop: '',
  level2: document.getElementById('ss-level2').value,
  n: document.getElementById('ss-n').defaultValue,
  prop2: document.getElementById('ss-prop2').defaultValue,
  pop2: ''
};

const urlParams = UrlState.read();
if (urlParams.level) document.getElementById('ss-level').value = urlParams.level;
if (urlParams.margin) document.getElementById('ss-margin').value = urlParams.margin;
if (urlParams.prop) document.getElementById('ss-prop').value = urlParams.prop;
if (urlParams.pop) document.getElementById('ss-pop').value = urlParams.pop;
if (urlParams.level2) document.getElementById('ss-level2').value = urlParams.level2;
if (urlParams.n) document.getElementById('ss-n').value = urlParams.n;
if (urlParams.prop2) document.getElementById('ss-prop2').value = urlParams.prop2;
if (urlParams.pop2) document.getElementById('ss-pop2').value = urlParams.pop2;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#ss-margin, #ss-prop, #ss-pop, #ss-n, #ss-prop2, #ss-pop2').forEach(el=>{
  el.addEventListener('input', recalc);
});
document.getElementById('ss-level').addEventListener('change', recalc);
document.getElementById('ss-level2').addEventListener('change', recalc);

recalc();
