const WEEKDAY = ['일','월','화','수','목','금','토'];

function fmtDate(d){
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}. (${WEEKDAY[d.getDay()]})`;
}

function addDays(d, n){
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function recalc(){
  const lmpVal = document.getElementById('ov-lmp').value;
  const cycle = parseInt(document.getElementById('ov-cycle').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const previewBody = document.getElementById('previewBody');
  const meta = document.getElementById('page-meta');

  const lmp = parseIsoDate(lmpVal);

  if (!lmp || !cycle || cycle <= 0){
    miniScreen.textContent = '--';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">마지막 생리 시작일과 생리주기를 확인해 주세요</td></tr>';
    previewBody.innerHTML = '';
    meta.textContent = '--';
    return;
  }

  const nextPeriod = addDays(lmp, cycle);
  const ovulation = addDays(nextPeriod, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 2);

  miniScreen.textContent = fmtDate(ovulation);
  miniScreenSub.textContent = '배란 예상일';

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>배란 예상일</th><td>${fmtDate(ovulation)}</td></tr>
    <tr><th>가임기</th><td>${fmtDate(fertileStart)} ~ ${fmtDate(fertileEnd)}</td></tr>
    <tr><th>다음 생리 예정일</th><td>${fmtDate(nextPeriod)}</td></tr>
    <tr><th>생리주기</th><td>${cycle}일</td></tr>
  `;

  let previewRows = '';
  for (let i = 1; i <= 3; i++){
    const periodDate = addDays(lmp, cycle * i);
    const ovDate = addDays(periodDate, -14);
    previewRows += `<tr><th>${i}번째 주기</th><td>배란 ${fmtDate(ovDate)} · 생리 ${fmtDate(periodDate)}</td></tr>`;
  }
  previewBody.innerHTML = previewRows;

  meta.textContent = `마지막 생리 ${lmpVal} · 주기 ${cycle}일`;

  UrlState.sync({ lmp: lmpVal, cycle }, URL_DEFAULTS);
}

attachDateMask('ov-lmp', recalc);
document.getElementById('ov-cycle').addEventListener('input', recalc);

const URL_DEFAULTS = {
  lmp: document.getElementById('ov-lmp').defaultValue,
  cycle: document.getElementById('ov-cycle').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.lmp) document.getElementById('ov-lmp').value = urlParams.lmp;
if (urlParams.cycle) document.getElementById('ov-cycle').value = urlParams.cycle;

recalc();
