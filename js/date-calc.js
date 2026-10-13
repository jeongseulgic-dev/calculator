let mode = 'between';
let addOp = '+';
let addUnit = 'day';

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

// 월·년 단위 이동: 결과 달에 같은 날짜가 없으면 그 달 말일 (민법 제160조 제3항과 같은 방식)
function addMonthsClamped(d, n){
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
}

function calendarDiff(start, end){
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (addMonthsClamped(start, months) > end) months -= 1;
  const d = Math.round((end - addMonthsClamped(start, months)) / 86400000);
  return { y: Math.floor(months / 12), m: months % 12, d };
}

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

document.querySelectorAll('.seg-toggle[data-target="addOp"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="addOp"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    addOp = btn.dataset.value;
    recalc();
  });
});

document.querySelectorAll('.seg-toggle[data-target="addUnit"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="addUnit"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    addUnit = btn.dataset.value;
    recalc();
  });
});

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'between'){
    const start = parseIsoDate(document.getElementById('d-start').value);
    const end = parseIsoDate(document.getElementById('d-end').value);
    if (!start || !end){
      miniScreen.textContent = '0일';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">시작일과 종료일을 YYYY-MM-DD 형식으로 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const [from, to] = start <= end ? [start, end] : [end, start];
    const totalDays = Math.round((to - from) / 86400000);
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const diff = calendarDiff(from, to);

    miniScreen.textContent = totalDays.toLocaleString('ko-KR') + '일';
    miniScreenSub.textContent = `${diff.y}년 ${diff.m}개월 ${diff.d}일`;
    meta.textContent = `시작일 ${document.getElementById('d-start').value} · 종료일 ${document.getElementById('d-end').value}`;

    statBody.innerHTML = `
      <tr><th>시작일</th><td>${fmtDate(from)}</td></tr>
      <tr><th>종료일</th><td>${fmtDate(to)}</td></tr>
      <tr class="stat-highlight"><th>총 일수</th><td>${totalDays.toLocaleString('ko-KR')}일</td></tr>
      <tr><th>포함 일수 (양쪽 포함)</th><td>${(totalDays+1).toLocaleString('ko-KR')}일</td></tr>
      <tr><th>주(週) 환산</th><td>${weeks}주 ${remDays}일</td></tr>
      <tr><th>기간 (년/개월/일)</th><td>${diff.y}년 ${diff.m}개월 ${diff.d}일</td></tr>
    `;

    document.getElementById('nextBusiness').href = `business-day-calculator?start=${toInputValue(from)}&end=${toInputValue(to)}`;
    document.getElementById('nextDday').href = `dday-calculator?target=${toInputValue(to)}`;

    UrlState.sync({
      mode, start: document.getElementById('d-start').value, end: document.getElementById('d-end').value
    }, URL_DEFAULTS);
  }

  else if (mode === 'add'){
    const base = parseIsoDate(document.getElementById('d-base').value);
    const amount = parseInt(document.getElementById('d-amount').value);
    if (!base || isNaN(amount)){
      miniScreen.textContent = '-';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">기준일(YYYY-MM-DD)과 값을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const signed = addOp === '+' ? amount : -amount;
    let result;
    if (addUnit === 'day') result = new Date(base.getFullYear(), base.getMonth(), base.getDate() + signed);
    else result = addMonthsClamped(base, addUnit === 'month' ? signed : signed * 12);
    const lastDayIncl = new Date(result.getFullYear(), result.getMonth(), result.getDate() - 1);

    const totalDaysDiff = Math.round((result - base) / 86400000);
    const unitLabel = addUnit === 'day' ? '일' : addUnit === 'month' ? '개월' : '년';

    miniScreen.textContent = `${result.getFullYear()}.${result.getMonth()+1}.${result.getDate()}`;
    miniScreenSub.textContent = `${WEEKDAY[result.getDay()]}요일`;
    meta.textContent = `기준일 ${document.getElementById('d-base').value} · 연산 ${addOp === '+' ? '+' : '-'}${amount}${unitLabel}`;

    statBody.innerHTML = `
      <tr><th>기준일</th><td>${fmtDate(base)}</td></tr>
      <tr><th>연산</th><td>${addOp === '+' ? '더하기' : '빼기'} ${amount}${unitLabel}</td></tr>
      <tr class="stat-highlight"><th>결과 날짜</th><td>${fmtDate(result)}</td></tr>
      ${addOp === '+' && amount > 0 ? `<tr><th>기준일을 첫날로 셀 때 마지막 날</th><td>${fmtDate(lastDayIncl)}</td></tr>` : ''}
      <tr><th>기준일과의 차이</th><td>${totalDaysDiff >= 0 ? '+' : ''}${totalDaysDiff.toLocaleString('ko-KR')}일</td></tr>
    `;

    document.getElementById('nextBusiness').href = result >= base
      ? `business-day-calculator?start=${toInputValue(base)}&end=${toInputValue(result)}`
      : `business-day-calculator?start=${toInputValue(result)}&end=${toInputValue(base)}`;
    document.getElementById('nextDday').href = `dday-calculator?target=${toInputValue(result)}`;

    UrlState.sync({
      mode, base: document.getElementById('d-base').value, amount, op: addOp, unit: addUnit
    }, URL_DEFAULTS);
  }
}

const today = new Date();
const in100Days = new Date(today.getTime() + 100*86400000);
document.getElementById('d-start').value = toInputValue(today);
document.getElementById('d-end').value = toInputValue(in100Days);
document.getElementById('d-base').value = toInputValue(today);

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  start: toInputValue(today),
  end: toInputValue(in100Days),
  base: toInputValue(today),
  amount: document.getElementById('d-amount').defaultValue,
  op: toggleDefault('addOp'),
  unit: toggleDefault('addUnit')
};

attachDateMask('d-start', recalc);
attachDateMask('d-end', recalc);
attachDateMask('d-base', recalc);
document.getElementById('d-amount').addEventListener('input', recalc);

const urlParams = UrlState.read();
if (urlParams.start) document.getElementById('d-start').value = urlParams.start;
if (urlParams.end) document.getElementById('d-end').value = urlParams.end;
if (urlParams.base) document.getElementById('d-base').value = urlParams.base;
if (urlParams.amount) document.getElementById('d-amount').value = urlParams.amount;
if (urlParams.op) clickToggle('addOp', urlParams.op);
if (urlParams.unit) clickToggle('addUnit', urlParams.unit);
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
