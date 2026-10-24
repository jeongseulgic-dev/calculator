function fmt0(n){ return Math.round(n).toLocaleString('ko-KR'); }

const RATE = {
  nationalPension: 0.0475,
  healthInsurance: 0.03595,
  longTermCare: 0.1314, // 건강보험료 대비
  employment: 0.009,
  npFloor: 410000,
  npCeil: 6590000
};

const MEAL_NONTAX_CAP = 200000; // 식대 비과세 한도 (월, 2023년~)
let mode = 'annual';
const URL_DEFAULTS = { mode: 'annual', salary: '40000000', monthly: '3000000', meal: String(MEAL_NONTAX_CAP), deps: '1', kids: '0' };

// 월 소득세는 js/wage-tax-table.js의 근로소득 간이세액표(wageTaxMonthly)로 구한다.

// 근로소득 백분위 구간별 연평균 근로소득(원) — 공공데이터포털 "국세청_근로소득 백분위(천분위)
// 자료"(2024년 귀속, 데이터 등록 2026-02-24) 원자료에서 각 구간(상위 N%) 행의
// 총급여÷인원으로 산출. 구간 컷오프 자체가 아니라 그 구간의 평균값을 근사치로 쓴다.
const INCOME_PERCENTILES = [
  { pct: 1, avg: 199530338 },
  { pct: 2, avg: 173320208 },
  { pct: 3, avg: 147173911 },
  { pct: 4, avg: 131172047 },
  { pct: 5, avg: 119841070 },
  { pct: 10, avg: 91169675 },
  { pct: 20, avg: 65341626 },
  { pct: 30, avg: 50626468 },
  { pct: 40, avg: 41006518 },
  { pct: 50, avg: 34167991 },
  { pct: 60, avg: 28531307 },
  { pct: 70, avg: 23843727 },
  { pct: 80, avg: 15835966 },
  { pct: 90, avg: 7668952 }
];

function incomePercentileLabel(annual){
  for (let i = 0; i < INCOME_PERCENTILES.length; i++){
    if (annual >= INCOME_PERCENTILES[i].avg){
      const lo = i === 0 ? null : INCOME_PERCENTILES[i - 1].pct;
      return lo === null ? '상위 1% 이내' : `상위 ${lo}~${INCOME_PERCENTILES[i].pct}%`;
    }
  }
  return '상위 90% 이하';
}

function earnedIncomeDeduction(annual){
  if (annual <= 5000000) return annual * 0.7;
  if (annual <= 15000000) return 3500000 + (annual - 5000000) * 0.4;
  if (annual <= 45000000) return 7500000 + (annual - 15000000) * 0.15;
  if (annual <= 100000000) return 12000000 + (annual - 45000000) * 0.05;
  return 14750000 + (annual - 100000000) * 0.02;
}

function taxBracketRate(base){
  if (base <= 14000000) return 6;
  if (base <= 50000000) return 15;
  if (base <= 88000000) return 24;
  if (base <= 150000000) return 35;
  if (base <= 300000000) return 38;
  if (base <= 500000000) return 40;
  if (base <= 1000000000) return 42;
  return 45;
}

// 간이세액표 비고 1의 '특별소득공제 및 특별세액공제 중 일부'(공제대상가족 수별 공식) — 결과의 'OO% 구간' 표시에만 쓴다
function tableSpecialDeduction(annual, family){
  const [base, r1, r2, r3] = family <= 1 ? [3100000, 0.04, 0.015, 0.005] : family === 2 ? [3600000, 0.04, 0.02, 0.01] : [5000000, 0.07, 0.05, 0.03];
  let d;
  if (annual <= 30000000) d = base + annual * r1;
  else if (annual <= 45000000) d = base + annual * r1 - (annual - 30000000) * 0.05;
  else if (annual <= 70000000) d = base + annual * r2;
  else if (annual <= 120000000) d = base + annual * r3;
  else d = 0;
  if (family >= 3 && annual > 40000000 && annual <= 120000000) d += (annual - 40000000) * 0.04;
  return d;
}

const floor10 = n => Math.floor(n / 10) * 10;

function calcSalary(annual, dependents, monthlyNontaxInput, kids = 0){
  const monthlyGross = Math.floor(annual / 12); // 월급(원 미만 버림)
  const monthlyNontax = Math.min(Math.max(monthlyNontaxInput || 0, 0), MEAL_NONTAX_CAP, monthlyGross);
  const monthlyTaxable = monthlyGross - monthlyNontax;
  const annualTaxable = annual - monthlyNontax * 12;

  // 4대보험 근로자 부담분: 10원 미만 버림. 국민연금은 기준소득월액(천원 미만 버림, 상·하한) 기준
  const wage = Math.floor(monthlyTaxable); // 보수월액(원 미만 버림)
  const npBase = Math.min(Math.max(Math.floor(wage / 1000) * 1000, RATE.npFloor), RATE.npCeil);
  const nationalPension = floor10(npBase * RATE.nationalPension);
  const healthInsurance = floor10(wage * RATE.healthInsurance);
  const longTermCare = floor10(healthInsurance * RATE.longTermCare);
  const employment = floor10(wage * RATE.employment);
  const monthlyInsurance = nationalPension + healthInsurance + longTermCare + employment;

  // 월 소득세: 근로소득 간이세액표(월급여액 = 비과세 제외, 공제대상가족 수, 8~20세 자녀 차감)
  const taxBeforeChild = wageTaxMonthly(wage, dependents);
  const monthlyIncomeTax = wageTaxMonthly(wage, dependents, kids);
  const childCredit = taxBeforeChild - monthlyIncomeTax;
  const monthlyLocalTax = floor10(monthlyIncomeTax * 0.1);

  // 'OO% 구간' 표시용 과세표준 추정(간이세액표 비고 1의 공제 구성을 따름)
  const earnedIncome = Math.max(annualTaxable - earnedIncomeDeduction(annualTaxable), 0);
  const taxBase = Math.max(earnedIncome - dependents * 1500000 - nationalPension * 12 - tableSpecialDeduction(annualTaxable, dependents), 0);

  const monthlyDeductionTotal = monthlyInsurance + monthlyIncomeTax + monthlyLocalTax;
  const monthlyNet = monthlyGross - monthlyDeductionTotal;

  return {
    monthlyGross, monthlyNontax, nationalPension, healthInsurance, longTermCare, employment,
    monthlyInsurance, monthlyIncomeTax, monthlyLocalTax, monthlyDeductionTotal, childCredit,
    monthlyNet, annualNet: monthlyNet * 12, bracketRate: taxBracketRate(taxBase)
  };
}

function recalc(){
  const monthlyInput = Number(document.getElementById('sl-salary-monthly').value.replace(/,/g, ''));
  const annualInput = Number(document.getElementById('sl-salary').value.replace(/,/g, ''));
  const annual = mode === 'monthly' ? monthlyInput * 12 : annualInput;
  const monthlyNontax = Number(document.getElementById('sl-nontax').value.replace(/,/g, '')) || 0;
  const dependents = Math.max(parseInt(document.getElementById('sl-dependents').value) || 1, 1);
  // 자녀는 부양가족(본인 포함) 안에 들어가므로 부양가족 수 − 1명을 넘을 수 없음
  const kidsInput = Math.max(parseInt(document.getElementById('sl-kids').value) || 0, 0);
  const kids = Math.min(kidsInput, dependents - 1);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  const percentileNote = document.getElementById('incomePercentileNote');

  if (!annual){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">' + (mode === 'monthly' ? '월급을' : '연봉을') + ' 입력해 주세요</td></tr>';
    meta.textContent = '--';
    percentileNote.textContent = '';
    return;
  }

  const r = calcSalary(annual, dependents, monthlyNontax, kids);
  const kidsNote = kids > 0 ? ` · 8~20세 자녀 ${kids}명` : '';

  miniScreen.textContent = fmt0(r.monthlyNet) + '원';
  miniScreenSub.textContent = '월 실수령액';
  meta.textContent = mode === 'monthly'
    ? `월급 ${fmt0(monthlyInput)}원(연봉 환산 ${fmt0(annual)}원) · 비과세 식대 ${fmt0(monthlyNontax)}원 · 부양가족 ${dependents}명${kidsNote}`
    : `연봉 ${fmt0(annual)}원 · 비과세 식대 ${fmt0(monthlyNontax)}원 · 부양가족 ${dependents}명${kidsNote}`;

  statBody.innerHTML = `
    <tr><th>월 급여 (세전)</th><td>${fmt0(r.monthlyGross)}원</td></tr>
    <tr><th>비과세 식대(4대보험·소득세 제외)</th><td>${fmt0(r.monthlyNontax)}원</td></tr>
    <tr><th>국민연금(4.75%)</th><td>-${fmt0(r.nationalPension)}원</td></tr>
    <tr><th>건강보험(3.6%)</th><td>-${fmt0(r.healthInsurance)}원</td></tr>
    <tr><th>장기요양보험(건강보험료의 13.14%)</th><td>-${fmt0(r.longTermCare)}원</td></tr>
    <tr><th>고용보험(0.9%)</th><td>-${fmt0(r.employment)}원</td></tr>
    <tr><th>소득세(${r.bracketRate}% 구간)</th><td>-${fmt0(r.monthlyIncomeTax)}원</td></tr>
    ${kids > 0 ? `<tr><th>└ 자녀 세액공제(${kids}명) 반영</th><td>${fmt0(r.childCredit)}원 감면</td></tr>` : ''}
    ${kidsInput > kids ? `<tr><th colspan="2" style="text-align:left; font-weight:400; color:var(--ink-soft);">자녀 수는 부양가족 수보다 1명 적게까지만 반영됩니다</th></tr>` : ''}
    <tr><th>지방소득세(10%)</th><td>-${fmt0(r.monthlyLocalTax)}원</td></tr>
    <tr><th>공제액 합계</th><td>-${fmt0(r.monthlyDeductionTotal)}원</td></tr>
    <tr><th>연 실수령액</th><td>${fmt0(r.annualNet)}원</td></tr>
    <tr class="stat-highlight"><th>월 실수령액</th><td>${fmt0(r.monthlyNet)}원</td></tr>
  `;
  percentileNote.textContent = `근로소득 기준 ${incomePercentileLabel(annual)} 구간입니다 (2024년 귀속 자료)`;

  const roundedAnnual = Math.round(annual);
  document.getElementById('nextDsrDti').href = `dsr-dti-calculator?income=${roundedAnnual}`;
  document.getElementById('nextMortgage').href = `mortgage-calculator?income=${roundedAnnual}`;
  document.getElementById('nextJeonse').href = `jeonse-calculator?mode=butim&bIncome=${roundedAnnual}`;
  document.getElementById('nextPension').href = `national-pension-calculator?b=${Math.round(annual / 12)}`;
  document.getElementById('nextBudget').href = `budget-calculator?mode=compare&income2=${Math.round(r.monthlyNet)}`;
  document.getElementById('nextSeverance').href = `severance-pay-calculator?wage=${Math.round(r.monthlyGross)}`;
  document.getElementById('nextUnemployment').href = `unemployment-benefit-calculator?wage=${Math.round(r.monthlyGross)}`;

  UrlState.sync({ mode, salary: annualInput, monthly: monthlyInput, meal: monthlyNontax, deps: dependents, kids }, URL_DEFAULTS);
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

document.getElementById('sl-salary').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('sl-salary-monthly').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ addAmount(btn.dataset.target, Number(btn.dataset.add)); recalc(); });
});
document.querySelectorAll('.calc-key[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ resetAmount(btn.dataset.target); recalc(); });
});
document.getElementById('sl-nontax').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('sl-dependents').addEventListener('input', recalc);
document.getElementById('sl-kids').addEventListener('input', recalc);

const urlParams = UrlState.read();
document.getElementById('sl-salary').value = Number(urlParams.salary || URL_DEFAULTS.salary).toLocaleString('ko-KR');
document.getElementById('sl-salary-monthly').value = Number(urlParams.monthly || URL_DEFAULTS.monthly).toLocaleString('ko-KR');
document.getElementById('sl-nontax').value = Number(urlParams.meal != null ? urlParams.meal : URL_DEFAULTS.meal).toLocaleString('ko-KR');
if (urlParams.mode) clickToggle('mode', urlParams.mode);
if (urlParams.deps) document.getElementById('sl-dependents').value = urlParams.deps;
if (urlParams.kids) document.getElementById('sl-kids').value = urlParams.kids;

recalc();
