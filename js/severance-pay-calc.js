const TENURE_DEDUCT = [
  { years: 5, calc: y => y * 1000000 },
  { years: 10, calc: y => 5000000 + (y - 5) * 2000000 },
  { years: 20, calc: y => 15000000 + (y - 10) * 2500000 },
  { years: Infinity, calc: y => 40000000 + (y - 20) * 3000000 }
];
const CONV_DEDUCT = [
  { limit: 8000000, calc: g => g },
  { limit: 70000000, calc: g => 8000000 + (g - 8000000) * 0.6 },
  { limit: 100000000, calc: g => 45200000 + (g - 70000000) * 0.55 },
  { limit: 300000000, calc: g => 61700000 + (g - 100000000) * 0.45 },
  { limit: Infinity, calc: g => 151700000 + (g - 300000000) * 0.35 }
];
const TAX_BRACKETS = [
  { limit: 14000000, rate: 0.06, ded: 0 },
  { limit: 50000000, rate: 0.15, ded: 1260000 },
  { limit: 88000000, rate: 0.24, ded: 5760000 },
  { limit: 150000000, rate: 0.35, ded: 15440000 },
  { limit: 300000000, rate: 0.38, ded: 19940000 },
  { limit: 500000000, rate: 0.40, ded: 25940000 },
  { limit: 1000000000, rate: 0.42, ded: 35940000 },
  { limit: Infinity, rate: 0.45, ded: 65940000 }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function tenureDeduction(years){
  return TENURE_DEDUCT.find(r => years <= r.years).calc(years);
}
function convDeduction(g){
  if (g <= 0) return 0;
  return CONV_DEDUCT.find(r => g <= r.limit).calc(g);
}
function incomeTax(base){
  if (base <= 0) return 0;
  const row = TAX_BRACKETS.find(r => base <= r.limit);
  return base * row.rate - row.ded;
}

function toInputValue(d){
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d, n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function minusMonthsClamped(d, n){
  const y = d.getFullYear(), m = d.getMonth() - n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last));
}
// 세법상 근속연수: 입사일~퇴직일 사이 달력 기준 만 년수, 1년 미만 끝수는 올림 (소득세법 시행령 제105조)
function taxServiceYears(start, retireDate){
  let y = retireDate.getFullYear() - start.getFullYear();
  if (new Date(start.getFullYear() + y, start.getMonth(), start.getDate()) > retireDate) y--;
  const rem = new Date(start.getFullYear() + y, start.getMonth(), start.getDate()) < retireDate;
  return Math.max(1, y + (rem ? 1 : 0));
}
function num(id){ const v = parseFloat(document.getElementById(id).value.replace(/,/g, '')); return Number.isFinite(v) ? v : 0; }

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const start = parseIsoDate(document.getElementById('sp-start').value);
  const lastDay = parseIsoDate(document.getElementById('sp-end').value);
  const wage = parseFloat(document.getElementById('sp-wage').value.replace(/,/g, ''));
  const bonus = Math.max(0, num('sp-bonus'));
  const leavePay = Math.max(0, num('sp-leave'));

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!start || !lastDay || !Number.isFinite(wage) || wage <= 0){
    fail('입사일·마지막 근무일(YYYY-MM-DD)과 평균 월급(0보다 큼)을 입력해 주세요');
    return;
  }

  if (lastDay < start){
    fail('마지막 근무일은 입사일과 같거나 뒤여야 합니다');
    return;
  }

  // 고용노동부 기준: 퇴직일 = 마지막 근무일 다음 날, 재직일수 = 퇴직일 − 입사일
  const retireDate = addDays(lastDay, 1);
  const serviceDays = Math.round((retireDate - start) / 86400000);

  if (serviceDays < 365){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '지급 대상 아님';
    meta.textContent = `재직일수 ${serviceDays}일`;
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">계속근로기간이 1년 미만이면 법정 퇴직금 지급 대상이 아닙니다 (재직일수 ${serviceDays}일)</td></tr>`;
    return;
  }

  // 평균임금 = 퇴직일 이전 3개월 임금총액(+상여금·연차수당 3/12) ÷ 그 3개월의 실제 일수
  const periodDays = Math.round((retireDate - minusMonthsClamped(retireDate, 3)) / 86400000);
  const wageTotal = wage * 3 + bonus * 3 / 12 + leavePay * 3 / 12;
  const avgDaily = wageTotal / periodDays;
  const severance = avgDaily * 30 * (serviceDays / 365);

  const taxYears = taxServiceYears(start, retireDate);
  const td = tenureDeduction(taxYears);
  const conv = Math.max(0, severance - td) * 12 / taxYears;
  const cd = convDeduction(conv);
  const base = Math.max(0, conv - cd);
  const convTax = incomeTax(base);
  const finalTax = convTax / 12 * taxYears;
  const localTax = finalTax * 0.1;
  const net = severance - finalTax - localTax;

  miniScreen.textContent = fmt(net) + '원';
  miniScreenSub.textContent = '세후 실수령액(추정)';
  meta.textContent = `근속 ${(serviceDays / 365).toFixed(1)}년 · 월급 ${fmt(wage)}원`;

  statBody.innerHTML = `
    <tr><th>재직일수</th><td>${serviceDays.toLocaleString('ko-KR')}일</td></tr>
    <tr><th>근속연수(세금 계산용, 올림)</th><td>${taxYears}년</td></tr>
    <tr><th>평균임금 산정기간</th><td>${periodDays}일</td></tr>
    <tr><th>3개월 임금총액</th><td>${fmt(wageTotal)}원</td></tr>
    <tr><th>1일 평균임금</th><td>${fmt(avgDaily)}원</td></tr>
    <tr class="stat-highlight"><th>법정 퇴직금</th><td>${fmt(severance)}원</td></tr>
    <tr><th>근속연수공제</th><td>${fmt(td)}원</td></tr>
    <tr><th>환산급여</th><td>${fmt(conv)}원</td></tr>
    <tr><th>환산급여공제</th><td>${fmt(cd)}원</td></tr>
    <tr><th>퇴직소득 과세표준</th><td>${fmt(base)}원</td></tr>
    <tr><th>퇴직소득세+지방소득세</th><td>${fmt(finalTax + localTax)}원</td></tr>
    <tr class="stat-highlight"><th>세후 실수령액(추정)</th><td>${fmt(net)}원</td></tr>
  `;

  document.getElementById('nextSalary').href = `salary-calculator?mode=monthly&monthly=${Math.round(wage)}`;
  document.getElementById('nextUnemployment').href = `unemployment-benefit-calculator?wage=${Math.round(wage)}`;
  document.getElementById('nextSimulator').href = `job-change-simulator?start=${document.getElementById('sp-start').value}&end=${document.getElementById('sp-end').value}&wage=${Math.round(wage)}`;

  UrlState.sync({
    start: document.getElementById('sp-start').value,
    end: document.getElementById('sp-end').value,
    wage, bonus, leave: leavePay
  }, URL_DEFAULTS);
}

['sp-wage', 'sp-bonus', 'sp-leave'].forEach(id => document.getElementById(id).addEventListener('input', function(){ formatInputComma(this); recalc(); }));
attachDateMask('sp-start', recalc);
attachDateMask('sp-end', recalc);

const today = new Date();
const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
document.getElementById('sp-start').value = toInputValue(fiveYearsAgo);
document.getElementById('sp-end').value = toInputValue(today);
document.getElementById('sp-wage').value = Number('3000000').toLocaleString('ko-KR');

const URL_DEFAULTS = {
  start: toInputValue(fiveYearsAgo),
  end: toInputValue(today),
  wage: '3000000',
  bonus: '0',
  leave: '0'
};

const urlParams = UrlState.read();
if (urlParams.start) document.getElementById('sp-start').value = urlParams.start;
if (urlParams.end) document.getElementById('sp-end').value = urlParams.end;
if (urlParams.wage) document.getElementById('sp-wage').value = Number(urlParams.wage).toLocaleString('ko-KR');
if (urlParams.bonus) document.getElementById('sp-bonus').value = Number(urlParams.bonus).toLocaleString('ko-KR');
if (urlParams.leave) document.getElementById('sp-leave').value = Number(urlParams.leave).toLocaleString('ko-KR');

recalc();
