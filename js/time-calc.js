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

// 야간근로(22:00~06:00)에 걸친 분 수. 시작 시각부터 경과시간만큼 1분씩 본다.
function nightMinutes(start, diff){
  let n = 0;
  for (let t = start; t < start + diff; t++){
    const m = ((t % 1440) + 1440) % 1440;
    if (m >= 1320 || m < 360) n++;
  }
  return n;
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
    // 근로기준법 제54조: 근로시간 4시간이면 30분, 8시간이면 1시간 이상 휴게
    const legalBreak = net >= 480 ? 60 : net >= 240 ? 30 : 0;
    const overtime = Math.max(0, net - 480);        // 1일 8시간 초과분 (근로기준법 제50조·제56조)
    const night = nightMinutes(start, diff);         // 22:00~06:00 (근로기준법 제56조 제3항)

    miniScreen.textContent = formatDuration(net);
    miniScreenSub.textContent = '휴게시간 제외 실제 시간';
    meta.textContent = `${document.getElementById('t-start').value} ~ ${document.getElementById('t-end').value}${crosses ? '(다음날)' : ''} · 휴게 ${breakMin}분`;

    statBody.innerHTML = `
      <tr><th>시작 시각</th><td>${formatClock12(start)}</td></tr>
      <tr><th>종료 시각</th><td>${formatClock12(end)}${crosses ? ' (다음날)' : ''}</td></tr>
      <tr class="stat-highlight"><th>전체 경과시간</th><td>${formatDuration(diff)}</td></tr>
      <tr><th>휴게시간</th><td>${formatDuration(breakMin)}</td></tr>
      <tr class="stat-highlight"><th>휴게시간 제외 실제 시간</th><td>${formatDuration(net)}</td></tr>
      ${legalBreak && breakMin < legalBreak ? `<tr><th colspan="2" style="text-align:left; font-weight:400; color:var(--ink-soft);">근로시간이 ${net >= 480 ? '8시간' : '4시간'} 이상이면 휴게시간은 ${legalBreak}분 이상이어야 합니다(근로기준법 제54조)</th></tr>` : ''}
      ${overtime ? `<tr><th>8시간 초과 근무<span class="sim-sub">연장근로</span></th><td>${formatDuration(overtime)}</td></tr>` : ''}
      ${night ? `<tr><th>밤 10시~아침 6시 근무<span class="sim-sub">야간근로, 휴게 포함</span></th><td>${formatDuration(night)}</td></tr>` : ''}
    `;

    // 이 근무를 주 5일 한다고 보고 시급 계산기로 넘김: 하루 8시간까지는 소정근로, 넘는 부분은 주 연장근로
    const daily = Math.min(net, 480) / 60;
    const weeklyOt = overtime / 60 * 5;
    document.getElementById('nextHourlyWage').href = `hourly-wage-calculator?daily=${Number(daily.toFixed(2))}&days=5${weeklyOt ? `&ot=${Number(weeklyOt.toFixed(2))}` : ''}`;

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
