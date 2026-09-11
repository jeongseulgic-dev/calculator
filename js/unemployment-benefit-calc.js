const UPPER_DAILY = 68100;
const LOWER_DAILY = 66048;
const MIN_MONTHS = 6;

const DAYS_TABLE = [
  { months: 12, under50: 120, over50: 120 },
  { months: 36, under50: 150, over50: 180 },
  { months: 60, under50: 180, over50: 210 },
  { months: 120, under50: 210, over50: 240 },
  { months: Infinity, under50: 240, over50: 270 }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function getBenefitDays(months, age){
  const row = DAYS_TABLE.find(r => months < r.months);
  return age >= 50 ? row.over50 : row.under50;
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const wage = parseFloat(document.getElementById('ub-wage').value.replace(/,/g, ''));
  const age = parseFloat(document.getElementById('ub-age').value);
  const months = parseFloat(document.getElementById('ub-months').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(wage) || wage <= 0 || !Number.isFinite(age) || age <= 0 || !Number.isFinite(months) || months < 0){
    fail('월급(0보다 큼), 나이, 가입기간(개월)을 입력해 주세요');
    return;
  }

  if (months < MIN_MONTHS){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '수급 자격 미충족';
    meta.textContent = `가입기간 ${months}개월`;
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">고용보험 가입기간이 180일(약 6개월) 미만이면 구직급여를 받을 수 없습니다</td></tr>`;
    return;
  }

  const avgDaily = wage * 3 / 90;
  const rawDaily = avgDaily * 0.6;
  const daily = Math.max(LOWER_DAILY, Math.min(UPPER_DAILY, rawDaily));
  const days = getBenefitDays(months, age);
  const total = daily * days;

  let clampNote = '해당 없음(60% 그대로 적용)';
  if (rawDaily > UPPER_DAILY) clampNote = `상한액 적용 (계산값 ${fmt(rawDaily)}원 → ${fmt(UPPER_DAILY)}원)`;
  else if (rawDaily < LOWER_DAILY) clampNote = `하한액 적용 (계산값 ${fmt(rawDaily)}원 → ${fmt(LOWER_DAILY)}원)`;

  miniScreen.textContent = fmt(total) + '원';
  miniScreenSub.textContent = '예상 총 수급액(추정)';
  meta.textContent = `월급 ${fmt(wage)}원 · 만 ${age}세 · 가입 ${months}개월`;

  statBody.innerHTML = `
    <tr><th>1일 평균임금(근사)</th><td>${fmt(avgDaily)}원</td></tr>
    <tr><th>1일 구직급여액(60%)</th><td>${fmt(daily)}원</td></tr>
    <tr><th>상한·하한 적용</th><td>${clampNote}</td></tr>
    <tr class="stat-highlight"><th>소정급여일수</th><td>${days}일</td></tr>
    <tr class="stat-highlight"><th>예상 총 수급액(추정)</th><td>${fmt(total)}원</td></tr>
  `;

  UrlState.sync({ wage, age, months }, URL_DEFAULTS);
}

document.getElementById('ub-wage').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('ub-age').addEventListener('input', recalc);
document.getElementById('ub-months').addEventListener('input', recalc);

const URL_DEFAULTS = { wage: '3000000', age: '35', months: '24' };

const urlParams = UrlState.read();
document.getElementById('ub-wage').value = Number(urlParams.wage || URL_DEFAULTS.wage).toLocaleString('ko-KR');
document.getElementById('ub-age').value = urlParams.age || URL_DEFAULTS.age;
document.getElementById('ub-months').value = urlParams.months || URL_DEFAULTS.months;

recalc();
