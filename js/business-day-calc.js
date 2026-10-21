const WEEKDAY = ['일','월','화','수','목','금','토'];
let mode = 'count';
let excludeHolidays = 'yes';

// 관공서 공휴일 (대체·임시공휴일, 선거일 포함). 2026년부터 노동절·제헌절 공휴일 지정.
// 출처: 우주항공청 월력요항(2027), 인사혁신처 관공서의 공휴일에 관한 규정
const HOLIDAYS = {
  '2025-01-01':'신정', '2025-01-27':'임시공휴일', '2025-01-28':'설날 연휴', '2025-01-29':'설날', '2025-01-30':'설날 연휴',
  '2025-03-01':'3·1절', '2025-03-03':'3·1절 대체공휴일', '2025-05-05':'어린이날·부처님오신날', '2025-05-06':'대체공휴일',
  '2025-06-03':'대통령 선거일', '2025-06-06':'현충일', '2025-08-15':'광복절', '2025-10-03':'개천절',
  '2025-10-05':'추석 연휴', '2025-10-06':'추석', '2025-10-07':'추석 연휴', '2025-10-08':'추석 대체공휴일',
  '2025-10-09':'한글날', '2025-12-25':'성탄절',

  '2026-01-01':'신정', '2026-02-16':'설날 연휴', '2026-02-17':'설날', '2026-02-18':'설날 연휴',
  '2026-03-01':'3·1절', '2026-03-02':'3·1절 대체공휴일', '2026-05-01':'노동절', '2026-05-05':'어린이날',
  '2026-05-24':'부처님오신날', '2026-05-25':'부처님오신날 대체공휴일', '2026-06-03':'전국동시지방선거일',
  '2026-06-06':'현충일', '2026-07-17':'제헌절', '2026-08-15':'광복절', '2026-08-17':'광복절 대체공휴일',
  '2026-09-24':'추석 연휴', '2026-09-25':'추석', '2026-09-26':'추석 연휴', '2026-10-03':'개천절',
  '2026-10-05':'개천절 대체공휴일', '2026-10-09':'한글날', '2026-12-25':'성탄절',

  '2027-01-01':'신정', '2027-02-06':'설날 연휴', '2027-02-07':'설날', '2027-02-08':'설날 연휴', '2027-02-09':'설날 대체공휴일',
  '2027-03-01':'3·1절', '2027-05-01':'노동절', '2027-05-03':'노동절 대체공휴일', '2027-05-05':'어린이날',
  '2027-05-13':'부처님오신날', '2027-06-06':'현충일', '2027-07-17':'제헌절', '2027-07-19':'제헌절 대체공휴일',
  '2027-08-15':'광복절', '2027-08-16':'광복절 대체공휴일', '2027-09-14':'추석 연휴', '2027-09-15':'추석',
  '2027-09-16':'추석 연휴', '2027-10-03':'개천절', '2027-10-04':'개천절 대체공휴일', '2027-10-09':'한글날',
  '2027-10-11':'한글날 대체공휴일', '2027-12-25':'성탄절', '2027-12-27':'성탄절 대체공휴일'
};
const HOLIDAY_YEARS = [2025, 2026, 2027];

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
function isWeekend(d){ return d.getDay() === 0 || d.getDay() === 6; }
// 평일에 걸린 공휴일만 따로 센다 (주말 공휴일은 이미 주말로 빠지므로)
function weekdayHoliday(d){
  if (excludeHolidays !== 'yes' || isWeekend(d)) return null;
  return HOLIDAYS[toInputValue(d)] || null;
}
function isBusinessDay(d){ return !isWeekend(d) && !weekdayHoliday(d); }
function outOfHolidayRange(from, to){
  return excludeHolidays === 'yes' && (from.getFullYear() < HOLIDAY_YEARS[0] || to.getFullYear() > HOLIDAY_YEARS[HOLIDAY_YEARS.length - 1]);
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '-';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'mode'){
        mode = btn.dataset.value;
        document.querySelectorAll('.mode-field').forEach(f=> f.classList.toggle('hidden', f.dataset.mode !== mode));
        document.querySelector('.screen .label').textContent = mode === 'count' ? '영업일 수' : 'N영업일 뒤';
      }
      if (group.dataset.target === 'holiday') excludeHolidays = btn.dataset.value;
      recalc();
    });
  });
});

function holidayRows(list){
  if (!list.length) return '';
  return list.map(d => `<tr><th>└ ${HOLIDAYS[toInputValue(d)]}</th><td>${fmtDate(d)}</td></tr>`).join('');
}
const rangeNote = `<tr><th colspan="2" style="text-align:left; font-weight:400; color:var(--ink-soft);">공휴일은 2025~2027년만 반영합니다. 그 밖의 해는 주말만 뺐습니다</th></tr>`;
const holidayLabel = () => excludeHolidays === 'yes' ? '주말·공휴일 제외' : '주말만 제외';

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'count'){
    const start = parseIsoDate(document.getElementById('bd-start').value);
    const end = parseIsoDate(document.getElementById('bd-end').value);
    if (!start || !end){ fail('시작일과 종료일을 YYYY-MM-DD 형식으로 입력해 주세요'); return; }

    const [from, to] = start <= end ? [start, end] : [end, start];
    let total = 0, weekend = 0, biz = 0;
    const holidays = [];
    for (let d = from; d <= to; d = addDays(d, 1)){
      total++;
      if (isWeekend(d)) weekend++;
      else if (weekdayHoliday(d)) holidays.push(d);
      else biz++;
    }

    miniScreen.textContent = biz.toLocaleString('ko-KR') + '일';
    miniScreenSub.textContent = `영업일 (${holidayLabel()})`;
    meta.textContent = `${document.getElementById('bd-start').value} ~ ${document.getElementById('bd-end').value} · 영업일 ${biz}일`;
    statBody.innerHTML = `
      <tr><th>시작일</th><td>${fmtDate(from)}</td></tr>
      <tr><th>종료일</th><td>${fmtDate(to)}</td></tr>
      <tr><th>전체 일수</th><td>${total.toLocaleString('ko-KR')}일</td></tr>
      <tr><th>주말</th><td>${weekend.toLocaleString('ko-KR')}일</td></tr>
      ${excludeHolidays === 'yes' ? `<tr><th>평일 공휴일</th><td>${holidays.length}일</td></tr>${holidays.length <= 12 ? holidayRows(holidays) : ''}` : ''}
      <tr class="stat-highlight"><th>영업일 수</th><td>${biz.toLocaleString('ko-KR')}일</td></tr>
      ${outOfHolidayRange(from, to) ? rangeNote : ''}
    `;
    UrlState.sync({ mode, holiday: excludeHolidays, start: document.getElementById('bd-start').value, end: document.getElementById('bd-end').value }, URL_DEFAULTS);
    return;
  }

  // N영업일 뒤: 기준일 다음 날부터 영업일만 세어 N번째 영업일
  const base = parseIsoDate(document.getElementById('bd-base').value);
  const n = Math.floor(parseFloat(document.getElementById('bd-n').value));
  if (!base || !(n >= 1) || n > 2000){ fail('기준일(YYYY-MM-DD)과 영업일 수(1~2000)를 입력해 주세요'); return; }

  let d = base, counted = 0;
  const skipped = [];
  while (counted < n){
    d = addDays(d, 1);
    if (isWeekend(d)) continue;
    if (weekdayHoliday(d)){ skipped.push(d); continue; }
    counted++;
  }
  const calendarDays = Math.round((d - base) / 86400000);

  miniScreen.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  miniScreenSub.textContent = `${d.getFullYear()}년 ${WEEKDAY[d.getDay()]}요일`;
  meta.textContent = `기준일 ${document.getElementById('bd-base').value} · ${n}영업일 뒤`;
  statBody.innerHTML = `
    <tr><th>기준일</th><td>${fmtDate(base)}</td></tr>
    <tr class="stat-highlight"><th>${n}영업일 뒤</th><td>${fmtDate(d)}</td></tr>
    <tr><th>달력상 기간</th><td>${calendarDays.toLocaleString('ko-KR')}일 뒤</td></tr>
    ${excludeHolidays === 'yes' ? `<tr><th>건너뛴 평일 공휴일</th><td>${skipped.length}일</td></tr>${skipped.length <= 12 ? holidayRows(skipped) : ''}` : ''}
    ${outOfHolidayRange(base, d) ? rangeNote : ''}
  `;
  UrlState.sync({ mode, holiday: excludeHolidays, base: document.getElementById('bd-base').value, n: document.getElementById('bd-n').value }, URL_DEFAULTS);
}

const today = new Date();
const in100Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 100);
document.getElementById('bd-start').value = toInputValue(today);
document.getElementById('bd-end').value = toInputValue(in100Days);
document.getElementById('bd-base').value = toInputValue(today);

const URL_DEFAULTS = {
  mode: 'count', holiday: 'yes',
  start: toInputValue(today), end: toInputValue(in100Days),
  base: toInputValue(today), n: document.getElementById('bd-n').defaultValue
};

attachDateMask('bd-start', recalc);
attachDateMask('bd-end', recalc);
attachDateMask('bd-base', recalc);
document.getElementById('bd-n').addEventListener('input', recalc);

const urlParams = UrlState.read();
if (urlParams.start) document.getElementById('bd-start').value = urlParams.start;
if (urlParams.end) document.getElementById('bd-end').value = urlParams.end;
if (urlParams.base) document.getElementById('bd-base').value = urlParams.base;
if (urlParams.n) document.getElementById('bd-n').value = urlParams.n;
if (urlParams.holiday) clickToggle('holiday', urlParams.holiday);
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
