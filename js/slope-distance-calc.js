function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }
const toDeg = r => r * 180 / Math.PI;

function recalc(){
  const x1 = parseFloat(document.getElementById('sd-x1').value);
  const y1 = parseFloat(document.getElementById('sd-y1').value);
  const x2 = parseFloat(document.getElementById('sd-x2').value);
  const y2 = parseFloat(document.getElementById('sd-y2').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (![x1, y1, x2, y2].every(Number.isFinite)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">두 점의 좌표를 모두 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  let slopeStr, angleStr, lineStr;
  if (dx === 0){
    slopeStr = '정의되지 않음 (수직선)';
    angleStr = '90°';
    lineStr = `x = ${fmt(x1)}`;
  } else {
    const m = dy / dx;
    const b = y1 - m * x1;
    slopeStr = fmt(m);
    angleStr = fmt(toDeg(Math.atan(m)), 2) + '°';
    lineStr = `y = ${fmt(m)}x ${b >= 0 ? '+' : '−'} ${fmt(Math.abs(b))}`;
  }

  miniScreen.textContent = dx === 0 ? '수직선' : fmt(dy / dx);
  miniScreenSub.textContent = '기울기 (m)';
  meta.textContent = `(${x1},${y1}) → (${x2},${y2})`;

  statBody.innerHTML = `
    <tr><th>점 1</th><td>(${fmt(x1)}, ${fmt(y1)})</td></tr>
    <tr><th>점 2</th><td>(${fmt(x2)}, ${fmt(y2)})</td></tr>
    <tr class="stat-highlight"><th>기울기 (m)</th><td>${slopeStr}</td></tr>
    <tr class="stat-highlight"><th>두 점 사이 거리</th><td>${fmt(distance)}</td></tr>
    <tr><th>중점</th><td>(${fmt(midX)}, ${fmt(midY)})</td></tr>
    <tr><th>직선의 방정식</th><td>${lineStr}</td></tr>
    <tr><th>기울기각 (θ, x축 기준)</th><td>${angleStr}</td></tr>
  `;

  UrlState.sync({ x1, y1, x2, y2 }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  x1: document.getElementById('sd-x1').defaultValue,
  y1: document.getElementById('sd-y1').defaultValue,
  x2: document.getElementById('sd-x2').defaultValue,
  y2: document.getElementById('sd-y2').defaultValue
};

const urlParams = UrlState.read();
['x1','y1','x2','y2'].forEach(k=>{
  const el = document.getElementById('sd-' + k);
  if (urlParams[k] && el) el.value = urlParams[k];
});

document.querySelectorAll('#sd-x1, #sd-y1, #sd-x2, #sd-y2').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
