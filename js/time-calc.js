let mode = 'add';

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

document.querySelectorAll('.seg-toggle[data-target="sign"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="sign"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function pad(n){ return String(n).padStart(2, '0'); }

function parseTimeToMinutes(hhmm){
  if (!hhmm) return null;
  const parts = hhmm.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

function formatClock12(totalMin){
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h < 12 ? '오전' : '오후';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${period} ${h12}:${pad(min)}`;
}

function formatDuration(totalMin){
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

function dayLabel(offset){
  if (offset === 0) return '당일';
  if (offset > 0) return `${offset}일 후`;
  return `${-offset}일 전`;
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '--';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'add'){
    const base = parseTimeToMinutes(document.getElementById('t-base').value);
    const sign = toggleDefault('sign') === 'minus' ? -1 : 1;
    const hh = parseFloat(document.getElementById('t-addh').value) || 0;
    const mm = parseFloat(document.getElementById('t-addm').value) || 0;

    if (base === null || hh < 0 || mm < 0){
      fail('기준 시각과 더하거나 뺄 시간(0 이상)을 입력해 주세요');
      return;
    }

    const deltaMin = sign * (hh * 60 + mm);
    const resultMin = base + deltaMin;
    const dayOffset = Math.floor(resultMin / 1440);
    const clockMin = resultMin - dayOffset * 1440;

    miniScreen.textContent = formatClock12(clockMin);
    miniScreenSub.textContent = dayLabel(dayOffset);
    meta.textContent = `${document.getElementById('t-base').value} ${sign > 0 ? '+' : '−'} ${hh}시간 ${mm}분`;

    statBody.innerHTML = `
      <tr><th>기준 시각</th><td>${formatClock12(base)}</td></tr>
      <tr><th>${sign > 0 ? '더한' : '뺀'} 시간</th><td>${formatDuration(hh * 60 + mm)}</td></tr>
      <tr class="stat-highlight"><th>계산된 시각</th><td>${formatClock12(clockMin)}</td></tr>
      <tr class="stat-highlight"><th>날짜</th><td>${dayLabel(dayOffset)}</td></tr>
    `;

    UrlState.sync({ mode, base: document.getElementById('t-base').value, sign: sign > 0 ? 'plus' : 'minus', addh: hh, addm: mm }, URL_DEFAULTS);
  }

  else if (mode === 'between'){
    const start = parseTimeToMinutes(document.getElementById('t-start').value);
    const end = parseTimeToMinutes(document.getElementById('t-end').value);
    const breakMin = parseFloat(document.getElementById('t-break').value) || 0;

    if (start === null || end === null || breakMin < 0){
      fail('시작 시각, 종료 시각, 휴게시간(0 이상)을 입력해 주세요');
      return;
    }

    let diff = end - start;
    let crosses = false;
    if (diff < 0){ diff += 1440; crosses = true; }
    const net = Math.max(0, diff - breakMin);

    miniScreen.textContent = formatDuration(net);
    miniScreenSub.textContent = '휴게시간 제외 실제 시간';
    meta.textContent = `${document.getElementById('t-start').value} ~ ${document.getElementById('t-end').value}${crosses ? '(다음날)' : ''} · 휴게 ${breakMin}분`;

    statBody.innerHTML = `
      <tr><th>시작 시각</th><td>${formatClock12(start)}</td></tr>
      <tr><th>종료 시각</th><td>${formatClock12(end)}${crosses ? ' (다음날)' : ''}</td></tr>
      <tr class="stat-highlight"><th>전체 경과시간</th><td>${formatDuration(diff)}</td></tr>
      <tr><th>휴게시간</th><td>${formatDuration(breakMin)}</td></tr>
      <tr class="stat-highlight"><th>휴게시간 제외 실제 시간</th><td>${formatDuration(net)}</td></tr>
    `;

    document.getElementById('nextHourlyWage').href = `hourly-wage-calculator?daily=${(net / 60).toFixed(2)}&days=1`;

    UrlState.sync({ mode, start: document.getElementById('t-start').value, end: document.getElementById('t-end').value, brk: breakMin }, URL_DEFAULTS);
  }
}

document.getElementById('t-base').addEventListener('input', recalc);
document.getElementById('t-addh').addEventListener('input', recalc);
document.getElementById('t-addm').addEventListener('input', recalc);
document.getElementById('t-start').addEventListener('input', recalc);
document.getElementById('t-end').addEventListener('input', recalc);
document.getElementById('t-break').addEventListener('input', recalc);

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  base: document.getElementById('t-base').defaultValue,
  sign: toggleDefault('sign'),
  addh: document.getElementById('t-addh').defaultValue,
  addm: document.getElementById('t-addm').defaultValue,
  start: document.getElementById('t-start').defaultValue,
  end: document.getElementById('t-end').defaultValue,
  brk: document.getElementById('t-break').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.base) document.getElementById('t-base').value = urlParams.base;
if (urlParams.addh) document.getElementById('t-addh').value = urlParams.addh;
if (urlParams.addm) document.getElementById('t-addm').value = urlParams.addm;
if (urlParams.start) document.getElementById('t-start').value = urlParams.start;
if (urlParams.end) document.getElementById('t-end').value = urlParams.end;
if (urlParams.brk) document.getElementById('t-break').value = urlParams.brk;
if (urlParams.sign) clickToggle('sign', urlParams.sign);
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
