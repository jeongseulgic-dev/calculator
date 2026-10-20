const WEEKDAY = ['일','월','화','수','목','금','토'];
let mode = 'dday';

function toInputValue(d){
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function fmtDate(d){
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}. (${WEEKDAY[d.getDay()]})`;
}

function addDays(d, n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
// N주년: 같은 월·일, 그 해에 그 날짜가 없으면(2/29) 그 달 말일
function addYears(d, n){
  const y = d.getFullYear() + n;
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return new Date(y, d.getMonth(), Math.min(d.getDate(), last));
}
function dayDiff(a, b){ return Math.round((b - a) / 86400000); }
function ddayLabel(diff){ return diff > 0 ? `D-${diff}` : diff === 0 ? 'D-DAY' : `D+${Math.abs(diff)}`; }

function todayMidnight(){
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '-';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== mode);
    });
    document.querySelector('.screen .label').textContent = mode === 'dday' ? '디데이' : '오늘은';
    recalc();
  });
});

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  const today = todayMidnight();

  if (mode === 'dday'){
    const target = parseIsoDate(document.getElementById('dd-target').value);
    if (!target){ fail('기준일을 YYYY-MM-DD 형식으로 입력해 주세요'); return; }

    const diff = dayDiff(today, target);
    const label = ddayLabel(diff);
    miniScreen.textContent = label;
    miniScreenSub.textContent = fmtDate(target);
    meta.textContent = `기준일 ${document.getElementById('dd-target').value} · ${label}`;

    statBody.innerHTML = `
      <tr><th>오늘</th><td>${fmtDate(today)}</td></tr>
      <tr><th>기준일</th><td>${fmtDate(target)}</td></tr>
      <tr class="stat-highlight"><th>디데이(D-day)</th><td>${label}</td></tr>
      <tr><th>총 일수 차이</th><td>${Math.abs(diff).toLocaleString('ko-KR')}일</td></tr>
      <tr><th>주 단위</th><td>${Math.floor(Math.abs(diff) / 7)}주 ${Math.abs(diff) % 7}일</td></tr>
    `;
    document.getElementById('nextDate').href = `date-calculator?start=${toInputValue(diff >= 0 ? today : target)}&end=${toInputValue(diff >= 0 ? target : today)}`;
    UrlState.sync({ mode, target: document.getElementById('dd-target').value }, URL_DEFAULTS);
    return;
  }

  // 기념일 모드: 시작한 날을 1일째로 센다 (연애·아기 백일 등 한국식 기념일 셈법)
  const start = parseIsoDate(document.getElementById('dd-start').value);
  if (!start){ fail('시작일을 YYYY-MM-DD 형식으로 입력해 주세요'); return; }

  const nth = dayDiff(start, today) + 1;
  const milestones = [
    ...[100, 200, 300, 500, 1000].map(n => ({ name: `${n}일`, date: addDays(start, n - 1) })),
    ...[1, 2, 3].map(n => ({ name: `${n}주년`, date: addYears(start, n) }))
  ].sort((a, b) => a.date - b.date);
  const next = milestones.find(m => m.date >= today);

  miniScreen.textContent = nth >= 1 ? `${nth.toLocaleString('ko-KR')}일째` : ddayLabel(dayDiff(today, start));
  miniScreenSub.textContent = nth >= 1 ? `${fmtDate(start)}부터` : '아직 시작 전';
  meta.textContent = `시작일 ${document.getElementById('dd-start').value}` + (nth >= 1 ? ` · 오늘 ${nth}일째` : '');

  statBody.innerHTML = `
    <tr><th>시작일<span class="sim-sub">1일째</span></th><td>${fmtDate(start)}</td></tr>
    ${milestones.map(m => {
      const diff = dayDiff(today, m.date);
      const hl = next && m === next ? ' class="stat-highlight"' : '';
      return `<tr${hl}><th>${m.name}</th><td>${fmtDate(m.date)}<span class="sim-sub">${ddayLabel(diff)}</span></td></tr>`;
    }).join('')}
  `;
  document.getElementById('nextDate').href = `date-calculator?mode=add&base=${toInputValue(start)}`;
  UrlState.sync({ mode, start: document.getElementById('dd-start').value }, URL_DEFAULTS);
}

const initToday = new Date();
const in100Days = new Date(initToday.getFullYear(), initToday.getMonth(), initToday.getDate() + 100);
document.getElementById('dd-target').value = toInputValue(in100Days);
document.getElementById('dd-start').value = toInputValue(initToday);

const URL_DEFAULTS = {
  mode: 'dday',
  target: toInputValue(in100Days),
  start: toInputValue(initToday)
};

attachDateMask('dd-target', recalc);
attachDateMask('dd-start', recalc);

const urlParams = UrlState.read();
if (urlParams.target) document.getElementById('dd-target').value = urlParams.target;
if (urlParams.start) document.getElementById('dd-start').value = urlParams.start;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
