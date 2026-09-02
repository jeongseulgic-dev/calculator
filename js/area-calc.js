let shape = 'rect';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

document.getElementById('ar-shape').addEventListener('change', (e)=>{
  shape = e.target.value;
  document.querySelectorAll('.mode-field').forEach(f=>{
    f.classList.toggle('hidden', f.dataset.mode !== shape);
  });
  recalc();
});

function fail(msg){
  document.getElementById('miniScreen').textContent = '0';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function show(area, rows, metaText){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  miniScreen.textContent = fmt(area);
  miniScreenSub.textContent = '넓이';
  meta.textContent = metaText;
  statBody.innerHTML = rows + `<tr class="stat-highlight"><th>넓이</th><td>${fmt(area)}</td></tr>`;
}

function recalc(){
  if (shape === 'rect'){
    const l = parseFloat(document.getElementById('ar-l').value);
    const w = parseFloat(document.getElementById('ar-w').value);
    if (![l, w].every(v => Number.isFinite(v) && v > 0)){ fail('길이와 너비(0보다 큼)를 입력해 주세요'); return; }
    show(l * w, `<tr><th>길이</th><td>${fmt(l)}</td></tr><tr><th>너비</th><td>${fmt(w)}</td></tr>`, `직사각형 ${l}×${w}`);
    UrlState.sync({ shape, l, w }, URL_DEFAULTS);
  }
  else if (shape === 'tri'){
    const a = parseFloat(document.getElementById('ar-ta').value);
    const b = parseFloat(document.getElementById('ar-tb').value);
    const c = parseFloat(document.getElementById('ar-tc').value);
    if (![a, b, c].every(v => Number.isFinite(v) && v > 0) || a + b <= c || b + c <= a || a + c <= b){ fail('삼각형을 이룰 수 있는 세 변(양수)을 입력해 주세요'); return; }
    const s = (a + b + c) / 2;
    show(Math.sqrt(s * (s - a) * (s - b) * (s - c)), `<tr><th>변 a / b / c</th><td>${fmt(a)} / ${fmt(b)} / ${fmt(c)}</td></tr>`, `삼각형 ${a},${b},${c}`);
    UrlState.sync({ shape, ta: a, tb: b, tc: c }, URL_DEFAULTS);
  }
  else if (shape === 'trap'){
    const b1 = parseFloat(document.getElementById('ar-b1').value);
    const b2 = parseFloat(document.getElementById('ar-b2').value);
    const h = parseFloat(document.getElementById('ar-th').value);
    if (![b1, b2, h].every(v => Number.isFinite(v) && v > 0)){ fail('윗변·아랫변·높이(0보다 큼)를 입력해 주세요'); return; }
    show((b1 + b2) / 2 * h, `<tr><th>윗변 / 아랫변</th><td>${fmt(b1)} / ${fmt(b2)}</td></tr><tr><th>높이</th><td>${fmt(h)}</td></tr>`, `사다리꼴 ${b1},${b2},h=${h}`);
    UrlState.sync({ shape, b1, b2, th: h }, URL_DEFAULTS);
  }
  else if (shape === 'circle'){
    const r = parseFloat(document.getElementById('ar-r').value);
    if (!Number.isFinite(r) || r <= 0){ fail('반지름(0보다 큼)을 입력해 주세요'); return; }
    show(Math.PI * r * r, `<tr><th>반지름</th><td>${fmt(r)}</td></tr>`, `원 r=${r}`);
    UrlState.sync({ shape, r }, URL_DEFAULTS);
  }
  else if (shape === 'sector'){
    const r = parseFloat(document.getElementById('ar-sr').value);
    const angle = parseFloat(document.getElementById('ar-sa').value);
    if (!Number.isFinite(r) || r <= 0 || !Number.isFinite(angle) || angle <= 0 || angle > 360){ fail('반지름(0보다 큼)과 중심각(0~360도)을 입력해 주세요'); return; }
    show(Math.PI * r * r * (angle / 360), `<tr><th>반지름</th><td>${fmt(r)}</td></tr><tr><th>중심각</th><td>${fmt(angle)}°</td></tr>`, `부채꼴 r=${r}, ${angle}°`);
    UrlState.sync({ shape, sr: r, sa: angle }, URL_DEFAULTS);
  }
  else if (shape === 'ellipse'){
    const a = parseFloat(document.getElementById('ar-ea').value);
    const b = parseFloat(document.getElementById('ar-eb').value);
    if (![a, b].every(v => Number.isFinite(v) && v > 0)){ fail('장반경·단반경(0보다 큼)을 입력해 주세요'); return; }
    show(Math.PI * a * b, `<tr><th>장반경(a) / 단반경(b)</th><td>${fmt(a)} / ${fmt(b)}</td></tr>`, `타원 a=${a}, b=${b}`);
    UrlState.sync({ shape, ea: a, eb: b }, URL_DEFAULTS);
  }
  else if (shape === 'para'){
    const base = parseFloat(document.getElementById('ar-pb').value);
    const h = parseFloat(document.getElementById('ar-ph').value);
    if (![base, h].every(v => Number.isFinite(v) && v > 0)){ fail('밑변과 높이(0보다 큼)를 입력해 주세요'); return; }
    show(base * h, `<tr><th>밑변</th><td>${fmt(base)}</td></tr><tr><th>높이</th><td>${fmt(h)}</td></tr>`, `평행사변형 ${base}×${h}`);
    UrlState.sync({ shape, pb: base, ph: h }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  shape: document.getElementById('ar-shape').value,
  l: document.getElementById('ar-l').defaultValue,
  w: document.getElementById('ar-w').defaultValue,
  ta: document.getElementById('ar-ta').defaultValue,
  tb: document.getElementById('ar-tb').defaultValue,
  tc: document.getElementById('ar-tc').defaultValue,
  b1: document.getElementById('ar-b1').defaultValue,
  b2: document.getElementById('ar-b2').defaultValue,
  th: document.getElementById('ar-th').defaultValue,
  r: document.getElementById('ar-r').defaultValue,
  sr: document.getElementById('ar-sr').defaultValue,
  sa: document.getElementById('ar-sa').defaultValue,
  ea: document.getElementById('ar-ea').defaultValue,
  eb: document.getElementById('ar-eb').defaultValue,
  pb: document.getElementById('ar-pb').defaultValue,
  ph: document.getElementById('ar-ph').defaultValue
};

const urlParams = UrlState.read();
Object.keys(URL_DEFAULTS).forEach(key => {
  if (key === 'shape') return;
  const idMap = { l:'ar-l', w:'ar-w', ta:'ar-ta', tb:'ar-tb', tc:'ar-tc', b1:'ar-b1', b2:'ar-b2', th:'ar-th', r:'ar-r', sr:'ar-sr', sa:'ar-sa', ea:'ar-ea', eb:'ar-eb', pb:'ar-pb', ph:'ar-ph' };
  if (urlParams[key]) document.getElementById(idMap[key]).value = urlParams[key];
});
if (urlParams.shape){
  document.getElementById('ar-shape').value = urlParams.shape;
  shape = urlParams.shape;
  document.querySelectorAll('.mode-field').forEach(f=>{
    f.classList.toggle('hidden', f.dataset.mode !== shape);
  });
}

document.querySelectorAll('#ar-l, #ar-w, #ar-ta, #ar-tb, #ar-tc, #ar-b1, #ar-b2, #ar-th, #ar-r, #ar-sr, #ar-sa, #ar-ea, #ar-eb, #ar-pb, #ar-ph').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
