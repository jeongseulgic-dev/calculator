let mode = 'round';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:10 }); }

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    recalc();
  });
});

function roundTo(x, n, m){
  const factor = Math.pow(10, n);
  if (m === 'round') return Math.round(x * factor) / factor;
  if (m === 'ceil') return Math.ceil(x * factor) / factor;
  return Math.floor(x * factor) / factor;
}

const MODE_LABEL = { round: '반올림', ceil: '올림', floor: '버림(내림)' };

function recalc(){
  const x = parseFloat(document.getElementById('rd-x').value);
  const n = parseInt(document.getElementById('rd-n').value, 10);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(x) || !Number.isFinite(n)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">숫자와 자릿수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const result = roundTo(x, n, mode);
  const placeLabel = n > 0 ? `소수점 아래 ${n}째 자리까지` : n === 0 ? '일의 자리까지 (정수)' : `${fmt(Math.pow(10, -n))}의 자리까지`;

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = `${MODE_LABEL[mode]} · ${placeLabel}`;
  meta.textContent = `${x} · ${MODE_LABEL[mode]} · ${placeLabel}`;

  statBody.innerHTML = `
    <tr><th>원래 값</th><td>${fmt(x)}</td></tr>
    <tr><th>처리 방식</th><td>${MODE_LABEL[mode]} (${placeLabel})</td></tr>
    <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
  `;

  UrlState.sync({ x, n, mode }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  x: document.getElementById('rd-x').defaultValue,
  n: document.getElementById('rd-n').defaultValue,
  mode: toggleDefault('mode')
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('rd-x').value = urlParams.x;
if (urlParams.n) document.getElementById('rd-n').value = urlParams.n;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#rd-x, #rd-n').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
