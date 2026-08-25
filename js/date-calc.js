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

function calendarDiff(start, end){
  let y = end.getFullYear() - start.getFullYear();
  let m = end.getMonth() - start.getMonth();
  let d = end.getDate() - start.getDate();
  if (d < 0){
    m -= 1;
    d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (m < 0){ y -= 1; m += 12; }
  return { y, m, d };
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

  if (mode === 'between'){
    const start = parseIsoDate(document.getElementById('d-start').value);
    const end = parseIsoDate(document.getElementById('d-end').value);
    if (!start || !end){
      miniScreen.textContent = '0일';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">시작일과 종료일을 YYYY-MM-DD 형식으로 입력해 주세요</td></tr>';
      return;
    }
    const [from, to] = start <= end ? [start, end] : [end, start];
    const totalDays = Math.round((to - from) / 86400000);
    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;
    const diff = calendarDiff(from, to);

    miniScreen.textContent = totalDays.toLocaleString('ko-KR') + '일';
    miniScreenSub.textContent = `${diff.y}년 ${diff.m}개월 ${diff.d}일`;

    statBody.innerHTML = `
      <tr><th>시작일</th><td>${fmtDate(from)}</td></tr>
      <tr><th>종료일</th><td>${fmtDate(to)}</td></tr>
      <tr class="stat-highlight"><th>총 일수</th><td>${totalDays.toLocaleString('ko-KR')}일</td></tr>
      <tr><th>포함 일수 (양쪽 포함)</th><td>${(totalDays+1).toLocaleString('ko-KR')}일</td></tr>
      <tr><th>주(週) 환산</th><td>${weeks}주 ${remDays}일</td></tr>
      <tr><th>기간 (년/개월/일)</th><td>${diff.y}년 ${diff.m}개월 ${diff.d}일</td></tr>
    `;

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
      return;
    }
    const signed = addOp === '+' ? amount : -amount;
    const result = new Date(base);
    if (addUnit === 'day') result.setDate(result.getDate() + signed);
    else if (addUnit === 'month') result.setMonth(result.getMonth() + signed);
    else if (addUnit === 'year') result.setFullYear(result.getFullYear() + signed);

    const totalDaysDiff = Math.round((result - base) / 86400000);
    const unitLabel = addUnit === 'day' ? '일' : addUnit === 'month' ? '개월' : '년';

    miniScreen.textContent = `${result.getFullYear()}.${result.getMonth()+1}.${result.getDate()}`;
    miniScreenSub.textContent = `${WEEKDAY[result.getDay()]}요일`;

    statBody.innerHTML = `
      <tr><th>기준일</th><td>${fmtDate(base)}</td></tr>
      <tr><th>연산</th><td>${addOp === '+' ? '더하기' : '빼기'} ${amount}${unitLabel}</td></tr>
      <tr class="stat-highlight"><th>결과 날짜</th><td>${fmtDate(result)}</td></tr>
      <tr><th>기준일과의 차이</th><td>${totalDaysDiff >= 0 ? '+' : ''}${totalDaysDiff.toLocaleString('ko-KR')}일</td></tr>
    `;

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
