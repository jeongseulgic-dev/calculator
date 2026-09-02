function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:4 }); }

function recalc(){
  const n0 = parseFloat(document.getElementById('hl-n0').value);
  const halfLife = parseFloat(document.getElementById('hl-half').value);
  const t = parseFloat(document.getElementById('hl-t').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(n0) || !Number.isFinite(halfLife) || !Number.isFinite(t) || n0 < 0 || halfLife <= 0 || t < 0){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">초기량(0 이상), 반감기(0보다 큼), 경과시간(0 이상)을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const elapsedHalfLives = t / halfLife;
  const remaining = n0 * Math.pow(0.5, elapsedHalfLives);
  const remainingPct = n0 === 0 ? 0 : remaining / n0 * 100;

  miniScreen.textContent = fmt(remaining);
  miniScreenSub.textContent = `${fmt(remainingPct)}% 남음`;
  meta.textContent = `초기량 ${fmt(n0)} · 반감기 ${fmt(halfLife)} · 경과 ${fmt(t)}`;

  statBody.innerHTML = `
    <tr><th>초기량</th><td>${fmt(n0)}</td></tr>
    <tr><th>반감기</th><td>${fmt(halfLife)}</td></tr>
    <tr><th>경과 시간</th><td>${fmt(t)} (${fmt(elapsedHalfLives)}회 반감기 경과)</td></tr>
    <tr class="stat-highlight"><th>잔여량</th><td>${fmt(remaining)} (${fmt(remainingPct)}%)</td></tr>
  `;

  UrlState.sync({ n0, half: halfLife, t }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  n0: document.getElementById('hl-n0').defaultValue,
  half: document.getElementById('hl-half').defaultValue,
  t: document.getElementById('hl-t').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.n0) document.getElementById('hl-n0').value = urlParams.n0;
if (urlParams.half) document.getElementById('hl-half').value = urlParams.half;
if (urlParams.t) document.getElementById('hl-t').value = urlParams.t;

document.querySelectorAll('#hl-n0, #hl-half, #hl-t').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
