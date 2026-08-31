function addDays(d, n){
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d){
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
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

  const lmp = parseIsoDate(lmpVal);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!lmp || lmp > today){
    miniScreen.textContent = '--';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">마지막 생리 시작일을 오늘 이전 날짜로 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const dueDate = addDays(lmp, 280 + (cycle - 28));
  const daysSinceLmp = Math.round((today - lmp) / 86400000);
  const gaWeeks = Math.floor(daysSinceLmp / 7);
  const gaDays = daysSinceLmp % 7;
  const dDay = Math.round((dueDate - today) / 86400000);
  const rangeStart = addDays(dueDate, -14);
  const rangeEnd = addDays(dueDate, 14);

  miniScreen.textContent = fmtDate(dueDate);
  miniScreenSub.textContent = `현재 임신 ${gaWeeks}주 ${gaDays}일`;

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>출산예정일</th><td>${fmtDate(dueDate)}</td></tr>
    <tr><th>현재 임신 주수</th><td>${gaWeeks}주 ${gaDays}일</td></tr>
    <tr><th>임신 삼분기</th><td>${trimesterLabel(daysSinceLmp)}</td></tr>
    <tr><th>예정일까지</th><td>${dDay >= 0 ? `D-${dDay}` : `예정일 ${Math.abs(dDay)}일 지남`}</td></tr>
    <tr><th>정상 분만 예상 범위 (38~42주)</th><td>${fmtDate(rangeStart)} ~ ${fmtDate(rangeEnd)}</td></tr>
  `;

  meta.textContent = `마지막 생리 ${lmpVal} · 주기 ${cycle}일`;

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
