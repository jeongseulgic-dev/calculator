let mode = 'sss';

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

function classify(a, b, c, A, B, C){
  let sideType;
  if (Math.abs(a - b) < 1e-6 && Math.abs(b - c) < 1e-6) sideType = '정삼각형';
  else if (Math.abs(a - b) < 1e-6 || Math.abs(b - c) < 1e-6 || Math.abs(a - c) < 1e-6) sideType = '이등변삼각형';
  else sideType = '부등변삼각형';
  const maxAngle = Math.max(A, B, C);
  let angleType;
  if (Math.abs(maxAngle - 90) < 1e-4) angleType = '직각삼각형';
  else if (maxAngle > 90) angleType = '둔각삼각형';
  else angleType = '예각삼각형';
  return `${sideType} · ${angleType}`;
}

function showResult(a, b, c, A, B, C, meta){
  const area = 0.5 * a * b * Math.sin(toRad(C));
  const perimeter = a + b + c;
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const metaEl = document.getElementById('page-meta');

  miniScreen.textContent = fmt(area);
  miniScreenSub.textContent = '삼각형 넓이';
  metaEl.textContent = meta;

  statBody.innerHTML = `
    <tr><th>변 a / b / c</th><td>${fmt(a)} / ${fmt(b)} / ${fmt(c)}</td></tr>
    <tr><th>각 A / B / C</th><td>${fmt(A, 2)}° / ${fmt(B, 2)}° / ${fmt(C, 2)}°</td></tr>
    <tr class="stat-highlight"><th>넓이</th><td>${fmt(area)}</td></tr>
    <tr class="stat-highlight"><th>둘레</th><td>${fmt(perimeter)}</td></tr>
    <tr><th>분류</th><td>${classify(a, b, c, A, B, C)}</td></tr>
  `;
}

function recalc(){
  if (mode === 'sss'){
    const a = parseFloat(document.getElementById('tr-a').value);
    const b = parseFloat(document.getElementById('tr-b').value);
    const c = parseFloat(document.getElementById('tr-c').value);
    if (![a, b, c].every(v => Number.isFinite(v) && v > 0) || a + b <= c || b + c <= a || a + c <= b){
      fail('세 변이 삼각형을 이룰 수 있는 양수여야 합니다 (두 변의 합 &gt; 나머지 한 변)');
      return;
    }
    const A = toDeg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
    const B = toDeg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
    const C = 180 - A - B;
    showResult(a, b, c, A, B, C, `a=${a}, b=${b}, c=${c} (SSS)`);
    UrlState.sync({ mode, a, b, c }, URL_DEFAULTS);
  }

  else if (mode === 'sas'){
    const a = parseFloat(document.getElementById('tr-sa').value);
    const b = parseFloat(document.getElementById('tr-sb').value);
    const C = parseFloat(document.getElementById('tr-sC').value);
    if (![a, b, C].every(Number.isFinite) || a <= 0 || b <= 0 || C <= 0 || C >= 180){
      fail('두 변(0보다 큼)과 끼인각(0~180도 사이)을 입력해 주세요');
      return;
    }
    const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(toRad(C)));
    const A = toDeg(Math.asin(a * Math.sin(toRad(C)) / c));
    const B = 180 - A - C;
    showResult(a, b, c, A, B, C, `a=${a}, b=${b}, C=${C}° (SAS)`);
    UrlState.sync({ mode, sa: a, sb: b, sC: C }, URL_DEFAULTS);
  }

  else if (mode === 'asa'){
    const a = parseFloat(document.getElementById('tr-aa').value);
    const B = parseFloat(document.getElementById('tr-aB').value);
    const C = parseFloat(document.getElementById('tr-aC').value);
    if (![a, B, C].every(Number.isFinite) || a <= 0 || B <= 0 || C <= 0 || B + C >= 180){
      fail('변(0보다 큼)과 두 각(합이 180도 미만)을 입력해 주세요');
      return;
    }
    const A = 180 - B - C;
    const b = a * Math.sin(toRad(B)) / Math.sin(toRad(A));
    const c = a * Math.sin(toRad(C)) / Math.sin(toRad(A));
    showResult(a, b, c, A, B, C, `a=${a}, B=${B}°, C=${C}° (ASA)`);
    UrlState.sync({ mode, aa: a, aB: B, aC: C }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  a: document.getElementById('tr-a').defaultValue,
  b: document.getElementById('tr-b').defaultValue,
  c: document.getElementById('tr-c').defaultValue,
  sa: document.getElementById('tr-sa').defaultValue,
  sb: document.getElementById('tr-sb').defaultValue,
  sC: document.getElementById('tr-sC').defaultValue,
  aa: document.getElementById('tr-aa').defaultValue,
  aB: document.getElementById('tr-aB').defaultValue,
  aC: document.getElementById('tr-aC').defaultValue
};

const urlParams = UrlState.read();
[['a','tr-a'],['b','tr-b'],['c','tr-c'],['sa','tr-sa'],['sb','tr-sb'],['sC','tr-sC'],['aa','tr-aa'],['aB','tr-aB'],['aC','tr-aC']].forEach(([k, id])=>{
  if (urlParams[k]) document.getElementById(id).value = urlParams[k];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#tr-a, #tr-b, #tr-c, #tr-sa, #tr-sb, #tr-sC, #tr-aa, #tr-aB, #tr-aC').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
