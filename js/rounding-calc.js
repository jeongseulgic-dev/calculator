let mode = 'round';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:10 }); }

document.getElementById('rd-mode').addEventListener('change', (e)=>{
  mode = e.target.value;
  recalc();
});

function roundHalfToParity(v, wantEven){
  const floorV = Math.floor(v);
  const diff = v - floorV;
  if (diff < 0.5) return floorV;
  if (diff > 0.5) return floorV + 1;
  const floorIsEven = floorV % 2 === 0;
  if (wantEven) return floorIsEven ? floorV : floorV + 1;
  return floorIsEven ? floorV + 1 : floorV;
}

function roundValue(scaled, m){
  if (m === 'round') return Math.round(scaled);
  if (m === 'ceil') return Math.ceil(scaled);
  if (m === 'floor') return Math.floor(scaled);
  if (m === 'awayZero'){
    const sign = scaled < 0 ? -1 : 1;
    return sign * Math.round(Math.abs(scaled));
  }
  if (m === 'towardZero'){
    const sign = scaled < 0 ? -1 : 1;
    const abs = Math.abs(scaled);
    const fracIsHalf = Math.abs((abs % 1) - 0.5) < 1e-9;
    return sign * (fracIsHalf ? Math.floor(abs) : Math.round(abs));
  }
  if (m === 'even') return roundHalfToParity(scaled, true);
  return roundHalfToParity(scaled, false);
}

function roundTo(x, n, m){
  const factor = Math.pow(10, n);
  return roundValue(x * factor, m) / factor;
}

const MODE_LABEL = {
  round: '반올림 (일반, 5는 위로)',
  ceil: '올림',
  floor: '버림(내림)',
  awayZero: '0에서 멀어지는 방향으로 반올림',
  towardZero: '0에 가까운 방향으로 반올림',
  even: '가까운 짝수로 반올림 (은행원 반올림)',
  odd: '가까운 홀수로 반올림'
};

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
    <tr><th>처리 방식</th><td>${MODE_LABEL[mode]}</td></tr>
    <tr><th>자릿수</th><td>${placeLabel}</td></tr>
    <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
  `;

  UrlState.sync({ x, n, mode }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  x: document.getElementById('rd-x').defaultValue,
  n: document.getElementById('rd-n').defaultValue,
  mode: document.getElementById('rd-mode').value
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('rd-x').value = urlParams.x;
if (urlParams.n) document.getElementById('rd-n').value = urlParams.n;
if (urlParams.mode){
  document.getElementById('rd-mode').value = urlParams.mode;
  mode = urlParams.mode;
}

document.querySelectorAll('#rd-x, #rd-n').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
