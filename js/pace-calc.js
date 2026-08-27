let mode = 'pace';

const DISTANCES = [
  { key: '1km', label: '1km', km: 1 },
  { key: '5km', label: '5km', km: 5 },
  { key: '10km', label: '10km', km: 10 },
  { key: 'half', label: '하프마라톤 (21.0975km)', km: 21.0975 },
  { key: 'full', label: '풀마라톤 (42.195km)', km: 42.195 }
];

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      const modes = (f.dataset.modes || '').split(' ');
      f.classList.toggle('hidden', !modes.includes(mode));
    });
    recalc();
  });
});

function pad(n){ return String(n).padStart(2, '0'); }

function formatClock(totalSec){
  totalSec = Math.round(totalSec);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatPace(secPerKm){
  secPerKm = Math.round(secPerKm);
  const m = Math.floor(secPerKm / 60);
  const s = secPerKm % 60;
  return `${m}'${pad(s)}"`;
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const raceBody = document.getElementById('raceBody');
  const meta = document.getElementById('page-meta');

  const distance = parseFloat(document.getElementById('r-distance').value);
  const h = parseInt(document.getElementById('r-hour').value) || 0;
  const m = parseInt(document.getElementById('r-min').value) || 0;
  const s = parseInt(document.getElementById('r-sec').value) || 0;
  const totalSecInput = h * 3600 + m * 60 + s;
  const paceMin = parseInt(document.getElementById('r-pace-min').value) || 0;
  const paceSec = parseInt(document.getElementById('r-pace-sec').value) || 0;
  const paceSecPerKmInput = paceMin * 60 + paceSec;

  let resolvedDistance, resolvedTotalSec, resolvedPace;

  if (mode === 'pace'){
    if (!distance || !totalSecInput){
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">거리와 완주 시간을 입력해 주세요</td></tr>';
      miniScreen.textContent = '0'; miniScreenSub.textContent = ''; raceBody.innerHTML = ''; meta.textContent = '--';
      return;
    }
    resolvedDistance = distance;
    resolvedTotalSec = totalSecInput;
    resolvedPace = totalSecInput / distance;
  } else if (mode === 'time'){
    if (!distance || !paceSecPerKmInput){
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">거리와 페이스를 입력해 주세요</td></tr>';
      miniScreen.textContent = '0'; miniScreenSub.textContent = ''; raceBody.innerHTML = ''; meta.textContent = '--';
      return;
    }
    resolvedDistance = distance;
    resolvedPace = paceSecPerKmInput;
    resolvedTotalSec = paceSecPerKmInput * distance;
  } else {
    if (!totalSecInput || !paceSecPerKmInput){
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">완주 시간과 페이스를 입력해 주세요</td></tr>';
      miniScreen.textContent = '0'; miniScreenSub.textContent = ''; raceBody.innerHTML = ''; meta.textContent = '--';
      return;
    }
    resolvedTotalSec = totalSecInput;
    resolvedPace = paceSecPerKmInput;
    resolvedDistance = totalSecInput / paceSecPerKmInput;
  }

  const speedKmh = 3600 / resolvedPace;

  if (mode === 'pace'){
    miniScreen.textContent = formatPace(resolvedPace);
    miniScreenSub.textContent = '페이스 (분/km)';
  } else if (mode === 'time'){
    miniScreen.textContent = formatClock(resolvedTotalSec);
    miniScreenSub.textContent = '완주 예상 시간';
  } else {
    miniScreen.textContent = resolvedDistance.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + 'km';
    miniScreenSub.textContent = '완주 가능 거리';
  }

  statBody.innerHTML = `
    <tr><th>거리</th><td>${resolvedDistance.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}km</td></tr>
    <tr><th>완주 시간</th><td>${formatClock(resolvedTotalSec)}</td></tr>
    <tr class="stat-highlight"><th>페이스</th><td>${formatPace(resolvedPace)}/km</td></tr>
    <tr><th>속도</th><td>${speedKmh.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}km/h</td></tr>
  `;

  raceBody.innerHTML = DISTANCES.map(d=>`
    <tr><th>${d.label}</th><td>${formatClock(resolvedPace * d.km)}</td></tr>
  `).join('');

  meta.textContent = `거리 ${resolvedDistance.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}km · 시간 ${formatClock(resolvedTotalSec)} · 페이스 ${formatPace(resolvedPace)}/km`;

  UrlState.sync({
    mode, distance, hour: h, min: m, sec: s, paceMin, paceSec
  }, URL_DEFAULTS);
}

document.querySelectorAll('#r-distance, #r-hour, #r-min, #r-sec, #r-pace-min, #r-pace-sec').forEach(el=>{
  el.addEventListener('input', recalc);
});

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  distance: document.getElementById('r-distance').defaultValue,
  hour: document.getElementById('r-hour').defaultValue,
  min: document.getElementById('r-min').defaultValue,
  sec: document.getElementById('r-sec').defaultValue,
  paceMin: document.getElementById('r-pace-min').defaultValue,
  paceSec: document.getElementById('r-pace-sec').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.distance) document.getElementById('r-distance').value = urlParams.distance;
if (urlParams.hour) document.getElementById('r-hour').value = urlParams.hour;
if (urlParams.min) document.getElementById('r-min').value = urlParams.min;
if (urlParams.sec) document.getElementById('r-sec').value = urlParams.sec;
if (urlParams.paceMin) document.getElementById('r-pace-min').value = urlParams.paceMin;
if (urlParams.paceSec) document.getElementById('r-pace-sec').value = urlParams.paceSec;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
