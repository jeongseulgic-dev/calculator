const WEEKDAY = ['일','월','화','수','목','금','토'];

function toInputValue(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function fmtDate(d){
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}. (${WEEKDAY[d.getDay()]})`;
}

function countBusinessDays(from, to){
  const totalDays = Math.round((to - from) / 86400000) + 1;
  const fullWeeks = Math.floor(totalDays / 7);
  let count = fullWeeks * 5;
  let day = from.getDay();
  for (let i = 0; i < totalDays % 7; i++){
    if (day !== 0 && day !== 6) count++;
    day = (day + 1) % 7;
  }
  return count;
}

function recalc(){
  const start = parseIsoDate(document.getElementById('bd-start').value);
  const end = parseIsoDate(document.getElementById('bd-end').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!start || !end){
    miniScreen.textContent = '0일';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">시작일과 종료일을 YYYY-MM-DD 형식으로 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const [from, to] = start <= end ? [start, end] : [end, start];
  const totalDays = Math.round((to - from) / 86400000) + 1;
  const bizDays = countBusinessDays(from, to);
  const weekendDays = totalDays - bizDays;

  miniScreen.textContent = bizDays.toLocaleString('ko-KR') + '일';
  miniScreenSub.textContent = '영업일 수 (주말 제외)';
  meta.textContent = `시작일 ${document.getElementById('bd-start').value} · 종료일 ${document.getElementById('bd-end').value} · 영업일 ${bizDays}일`;

  statBody.innerHTML = `
    <tr><th>시작일</th><td>${fmtDate(from)}</td></tr>
    <tr><th>종료일</th><td>${fmtDate(to)}</td></tr>
    <tr><th>전체 일수</th><td>${totalDays.toLocaleString('ko-KR')}일</td></tr>
    <tr class="stat-highlight"><th>영업일 수 (주말 제외)</th><td>${bizDays.toLocaleString('ko-KR')}일</td></tr>
    <tr><th>주말 일수</th><td>${weekendDays.toLocaleString('ko-KR')}일</td></tr>
  `;

  UrlState.sync({
    start: document.getElementById('bd-start').value, end: document.getElementById('bd-end').value
  }, URL_DEFAULTS);
}

const today = new Date();
const in100Days = new Date(today.getTime() + 100*86400000);
document.getElementById('bd-start').value = toInputValue(today);
document.getElementById('bd-end').value = toInputValue(in100Days);

const URL_DEFAULTS = {
  start: toInputValue(today),
  end: toInputValue(in100Days)
};

attachDateMask('bd-start', recalc);
attachDateMask('bd-end', recalc);

const urlParams = UrlState.read();
if (urlParams.start) document.getElementById('bd-start').value = urlParams.start;
if (urlParams.end) document.getElementById('bd-end').value = urlParams.end;

recalc();
