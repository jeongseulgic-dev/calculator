let shape = 'sphere';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

document.getElementById('vo-shape').addEventListener('change', (e)=>{
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

function show(volume, surface, rows, metaText){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  miniScreen.textContent = fmt(volume);
  miniScreenSub.textContent = '부피';
  meta.textContent = metaText;
  statBody.innerHTML = rows +
    `<tr class="stat-highlight"><th>부피</th><td>${fmt(volume)}</td></tr>` +
    `<tr class="stat-highlight"><th>표면적</th><td>${fmt(surface)}</td></tr>`;
}

function recalc(){
  if (shape === 'sphere'){
    const r = parseFloat(document.getElementById('vo-r').value);
    if (!Number.isFinite(r) || r <= 0){ fail('반지름(0보다 큼)을 입력해 주세요'); return; }
    const V = 4 / 3 * Math.PI * r ** 3;
    const S = 4 * Math.PI * r * r;
    show(V, S, `<tr><th>반지름</th><td>${fmt(r)}</td></tr>`, `구 r=${r}`);
    UrlState.sync({ shape, r }, URL_DEFAULTS);
  }
  else if (shape === 'cone'){
    const r = parseFloat(document.getElementById('vo-cr').value);
    const h = parseFloat(document.getElementById('vo-ch').value);
    if (![r, h].every(v => Number.isFinite(v) && v > 0)){ fail('밑면 반지름과 높이(0보다 큼)를 입력해 주세요'); return; }
    const l = Math.sqrt(r * r + h * h);
    const V = 1 / 3 * Math.PI * r * r * h;
    const S = Math.PI * r * r + Math.PI * r * l;
    show(V, S, `<tr><th>밑면 반지름</th><td>${fmt(r)}</td></tr><tr><th>높이</th><td>${fmt(h)}</td></tr>`, `원뿔 r=${r}, h=${h}`);
    UrlState.sync({ shape, cr: r, ch: h }, URL_DEFAULTS);
  }
  else if (shape === 'cube'){
    const a = parseFloat(document.getElementById('vo-a').value);
    if (!Number.isFinite(a) || a <= 0){ fail('한 변(0보다 큼)을 입력해 주세요'); return; }
    show(a ** 3, 6 * a * a, `<tr><th>한 변</th><td>${fmt(a)}</td></tr>`, `정육면체 a=${a}`);
    UrlState.sync({ shape, a }, URL_DEFAULTS);
  }
  else if (shape === 'cyl'){
    const r = parseFloat(document.getElementById('vo-ylr').value);
    const h = parseFloat(document.getElementById('vo-ylh').value);
    if (![r, h].every(v => Number.isFinite(v) && v > 0)){ fail('밑면 반지름과 높이(0보다 큼)를 입력해 주세요'); return; }
    const V = Math.PI * r * r * h;
    const S = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
    show(V, S, `<tr><th>밑면 반지름</th><td>${fmt(r)}</td></tr><tr><th>높이</th><td>${fmt(h)}</td></tr>`, `원기둥 r=${r}, h=${h}`);
    UrlState.sync({ shape, ylr: r, ylh: h }, URL_DEFAULTS);
  }
  else if (shape === 'box'){
    const l = parseFloat(document.getElementById('vo-bl').value);
    const w = parseFloat(document.getElementById('vo-bw').value);
    const h = parseFloat(document.getElementById('vo-bh').value);
    if (![l, w, h].every(v => Number.isFinite(v) && v > 0)){ fail('길이·너비·높이(0보다 큼)를 입력해 주세요'); return; }
    const V = l * w * h;
    const S = 2 * (l * w + l * h + w * h);
    show(V, S, `<tr><th>길이 / 너비 / 높이</th><td>${fmt(l)} / ${fmt(w)} / ${fmt(h)}</td></tr>`, `직육면체 ${l}×${w}×${h}`);
    UrlState.sync({ shape, bl: l, bw: w, bh: h }, URL_DEFAULTS);
  }
  else if (shape === 'pyramid'){
    const a = parseFloat(document.getElementById('vo-pa').value);
    const h = parseFloat(document.getElementById('vo-ph').value);
    if (![a, h].every(v => Number.isFinite(v) && v > 0)){ fail('밑변과 높이(0보다 큼)를 입력해 주세요'); return; }
    const slant = Math.sqrt(h * h + (a / 2) ** 2);
    const V = 1 / 3 * a * a * h;
    const S = a * a + 2 * a * slant;
    show(V, S, `<tr><th>밑변</th><td>${fmt(a)}</td></tr><tr><th>높이</th><td>${fmt(h)}</td></tr>`, `사각뿔 a=${a}, h=${h}`);
    UrlState.sync({ shape, pa: a, ph: h }, URL_DEFAULTS);
  }
  else if (shape === 'ellipsoid'){
    const a = parseFloat(document.getElementById('vo-ea').value);
    const b = parseFloat(document.getElementById('vo-eb').value);
    const c = parseFloat(document.getElementById('vo-ec').value);
    if (![a, b, c].every(v => Number.isFinite(v) && v > 0)){ fail('세 축(0보다 큼)을 입력해 주세요'); return; }
    const V = 4 / 3 * Math.PI * a * b * c;
    const p = 1.6075;
    const S = 4 * Math.PI * Math.pow((Math.pow(a, p) * Math.pow(b, p) + Math.pow(a, p) * Math.pow(c, p) + Math.pow(b, p) * Math.pow(c, p)) / 3, 1 / p);
    show(V, S, `<tr><th>축 a / b / c</th><td>${fmt(a)} / ${fmt(b)} / ${fmt(c)}</td></tr>`, `타원체 ${a},${b},${c}`);
    UrlState.sync({ shape, ea: a, eb: b, ec: c }, URL_DEFAULTS);
  }
  else if (shape === 'capsule'){
    const r = parseFloat(document.getElementById('vo-car').value);
    const h = parseFloat(document.getElementById('vo-cah').value);
    if (![r, h].every(v => Number.isFinite(v) && v > 0)){ fail('반지름과 원기둥 부분 높이(0보다 큼)를 입력해 주세요'); return; }
    const V = Math.PI * r * r * h + 4 / 3 * Math.PI * r ** 3;
    const S = 2 * Math.PI * r * h + 4 * Math.PI * r * r;
    show(V, S, `<tr><th>반지름</th><td>${fmt(r)}</td></tr><tr><th>원기둥 부분 높이</th><td>${fmt(h)}</td></tr>`, `캡슐 r=${r}, h=${h}`);
    UrlState.sync({ shape, car: r, cah: h }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  shape: document.getElementById('vo-shape').value,
  r: document.getElementById('vo-r').defaultValue,
  cr: document.getElementById('vo-cr').defaultValue,
  ch: document.getElementById('vo-ch').defaultValue,
  a: document.getElementById('vo-a').defaultValue,
  ylr: document.getElementById('vo-ylr').defaultValue,
  ylh: document.getElementById('vo-ylh').defaultValue,
  bl: document.getElementById('vo-bl').defaultValue,
  bw: document.getElementById('vo-bw').defaultValue,
  bh: document.getElementById('vo-bh').defaultValue,
  pa: document.getElementById('vo-pa').defaultValue,
  ph: document.getElementById('vo-ph').defaultValue,
  ea: document.getElementById('vo-ea').defaultValue,
  eb: document.getElementById('vo-eb').defaultValue,
  ec: document.getElementById('vo-ec').defaultValue,
  car: document.getElementById('vo-car').defaultValue,
  cah: document.getElementById('vo-cah').defaultValue
};

const ID_MAP = { r:'vo-r', cr:'vo-cr', ch:'vo-ch', a:'vo-a', ylr:'vo-ylr', ylh:'vo-ylh', bl:'vo-bl', bw:'vo-bw', bh:'vo-bh', pa:'vo-pa', ph:'vo-ph', ea:'vo-ea', eb:'vo-eb', ec:'vo-ec', car:'vo-car', cah:'vo-cah' };
const urlParams = UrlState.read();
Object.keys(ID_MAP).forEach(key => {
  if (urlParams[key]) document.getElementById(ID_MAP[key]).value = urlParams[key];
});
if (urlParams.shape){
  document.getElementById('vo-shape').value = urlParams.shape;
  shape = urlParams.shape;
  document.querySelectorAll('.mode-field').forEach(f=>{
    f.classList.toggle('hidden', f.dataset.mode !== shape);
  });
}

document.querySelectorAll('#vo-r, #vo-cr, #vo-ch, #vo-a, #vo-ylr, #vo-ylh, #vo-bl, #vo-bw, #vo-bh, #vo-pa, #vo-ph, #vo-ea, #vo-eb, #vo-ec, #vo-car, #vo-cah').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
