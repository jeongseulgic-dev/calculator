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

function recalc(){
  const target = parseIsoDate(document.getElementById('dd-target').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!target){
    miniScreen.textContent = '-';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">기준일을 YYYY-MM-DD 형식으로 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target - todayMid) / 86400000);
  const ddayLabel = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${Math.abs(diff)}`;

  miniScreen.textContent = ddayLabel;
  miniScreenSub.textContent = fmtDate(target);
  meta.textContent = `기준일 ${document.getElementById('dd-target').value} · ${ddayLabel}`;

  statBody.innerHTML = `
    <tr><th>오늘</th><td>${fmtDate(todayMid)}</td></tr>
    <tr><th>기준일</th><td>${fmtDate(target)}</td></tr>
    <tr class="stat-highlight"><th>디데이(D-day)</th><td>${ddayLabel}</td></tr>
    <tr><th>총 일수 차이</th><td>${Math.abs(diff).toLocaleString('ko-KR')}일</td></tr>
  `;

  UrlState.sync({ target: document.getElementById('dd-target').value }, URL_DEFAULTS);
}

const today = new Date();
const in100Days = new Date(today.getTime() + 100*86400000);
document.getElementById('dd-target').value = toInputValue(in100Days);

const URL_DEFAULTS = {
  target: toInputValue(in100Days)
};

attachDateMask('dd-target', recalc);

const urlParams = UrlState.read();
if (urlParams.target) document.getElementById('dd-target').value = urlParams.target;

recalc();
