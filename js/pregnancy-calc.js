function addDays(d, n){
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d){
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
}

function isoDate(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function trimesterLabel(daysSinceLmp){
  if (daysSinceLmp <= 97) return '1분기 (~13주 6일)';
  if (daysSinceLmp <= 195) return '2분기 (14주~27주 6일)';
  return '3분기 (28주~)';
}

function recalc(){
  const lmpVal = document.getElementById('pg-lmp').value;
  const cycle = parseInt(document.getElementById('pg-cycle').value) || 28;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  const nextDday = document.getElementById('nextDday');

  const lmp = parseIsoDate(lmpVal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lmp || lmp > today || cycle < 15 || cycle > 60){
    const msg = lmp && lmp <= today ? '생리주기는 15~60일 사이로 입력해 주세요' : '마지막 생리 시작일을 오늘 이전 날짜로 입력해 주세요';
    miniScreen.textContent = '--';
    miniScreenSub.textContent = '';
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
    meta.textContent = '--';
    nextDday.href = 'dday-calculator';
    return;
  }

  // 주기가 28일이 아니면 배란이 그만큼 늦거나 빠르므로 예정일과 임신 주수를 같은 일수만큼 보정한다
  const base = addDays(lmp, cycle - 28);
  const dueDate = addDays(base, 280);
  const daysSince = Math.round((today - base) / 86400000);
  const dDay = Math.round((dueDate - today) / 86400000);
  const gaText = daysSince < 0 ? '보정 기준일 이전' : `${Math.floor(daysSince / 7)}주 ${daysSince % 7}일`;

  miniScreen.textContent = fmtDate(dueDate);
  miniScreenSub.textContent = daysSince < 0 || daysSince > 300 ? '' : `현재 임신 ${gaText}`;

  const rows = [`<tr class="stat-highlight"><th>출산예정일 (40주 0일)</th><td>${fmtDate(dueDate)}</td></tr>`];
  if (daysSince > 300){
    rows.push('<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">마지막 생리 시작일로부터 43주가 넘었습니다. 날짜를 다시 확인해 주세요.</td></tr>');
  } else {
    rows.push(`<tr><th>현재 임신 주수</th><td>${gaText}</td></tr>`);
    if (daysSince >= 0) rows.push(`<tr><th>임신 삼분기</th><td>${trimesterLabel(daysSince)}</td></tr>`);
    rows.push(`<tr><th>예정일까지</th><td>${dDay >= 0 ? `D-${dDay}` : `예정일 ${Math.abs(dDay)}일 지남`}</td></tr>`);
  }
  rows.push(`<tr><th>만삭 범위 (37주 0일~41주 6일)</th><td>${fmtDate(addDays(base, 259))} ~ ${fmtDate(addDays(base, 293))}</td></tr>`);
  rows.push(`<tr><th>12주·32주가 되는 날</th><td>${fmtDate(addDays(base, 84))} · ${fmtDate(addDays(base, 224))}</td></tr>`);
  if (cycle < 21 || cycle > 35) rows.push('<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">생리주기가 일반적 범위(21~35일)를 벗어나 예정일 오차가 클 수 있습니다</td></tr>');
  statBody.innerHTML = rows.join('');

  meta.textContent = `마지막 생리 ${lmpVal} · 주기 ${cycle}일`;
  nextDday.href = `dday-calculator?target=${isoDate(dueDate)}`;

  UrlState.sync({ lmp: lmpVal, cycle }, URL_DEFAULTS);
}

attachDateMask('pg-lmp', recalc);
document.getElementById('pg-cycle').addEventListener('input', recalc);

const URL_DEFAULTS = {
  lmp: document.getElementById('pg-lmp').defaultValue,
  cycle: document.getElementById('pg-cycle').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.lmp) document.getElementById('pg-lmp').value = urlParams.lmp;
if (urlParams.cycle) document.getElementById('pg-cycle').value = urlParams.cycle;

recalc();
