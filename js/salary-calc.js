function fmt0(n){ return Math.round(n).toLocaleString('ko-KR'); }

const RATE = {
  nationalPension: 0.0475,
  healthInsurance: 0.03595,
  longTermCare: 0.1314, // 건강보험료 대비
  employment: 0.009,
  npFloor: 410000,
  npCeil: 6590000
};

function earnedIncomeDeduction(annual){
  if (annual <= 5000000) return annual * 0.7;
  if (annual <= 15000000) return 3500000 + (annual - 5000000) * 0.4;
  if (annual <= 45000000) return 7500000 + (annual - 15000000) * 0.15;
  if (annual <= 100000000) return 12000000 + (annual - 45000000) * 0.05;
  return 14750000 + (annual - 100000000) * 0.02;
}

function progressiveTax(base){
  if (base <= 14000000) return base * 0.06;
  if (base <= 50000000) return base * 0.15 - 1260000;
  if (base <= 88000000) return base * 0.24 - 5760000;
  if (base <= 150000000) return base * 0.35 - 15440000;
  if (base <= 300000000) return base * 0.38 - 19940000;
  if (base <= 500000000) return base * 0.40 - 25940000;
  if (base <= 1000000000) return base * 0.42 - 35940000;
  return base * 0.45 - 65940000;
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

function earnedIncomeTaxCreditLimit(annual){
  if (annual <= 33000000) return 740000;
  if (annual <= 70000000) return Math.max(740000 - (annual - 33000000) * 0.008, 660000);
  return Math.max(660000 - (annual - 70000000) * 0.5, 500000);
}

function calcSalary(annual, dependents){
  const monthlyGross = annual / 12;

  const npBase = Math.min(Math.max(monthlyGross, RATE.npFloor), RATE.npCeil);
  const nationalPension = Math.round(npBase * RATE.nationalPension);
  const healthInsurance = Math.round(monthlyGross * RATE.healthInsurance);
  const longTermCare = Math.round(healthInsurance * RATE.longTermCare);
  const employment = Math.round(monthlyGross * RATE.employment);
  const monthlyInsurance = nationalPension + healthInsurance + longTermCare + employment;

  const earnedDeduction = earnedIncomeDeduction(annual);
  const earnedIncome = Math.max(annual - earnedDeduction, 0);

  const personalDeduction = dependents * 1500000;
  const pensionDeduction = nationalPension * 12;
  const specialDeduction = (healthInsurance + longTermCare + employment) * 12;
  const totalDeduction = personalDeduction + pensionDeduction + specialDeduction;

  const taxBase = Math.max(earnedIncome - totalDeduction, 0);
  const calculatedTax = Math.max(progressiveTax(taxBase), 0);

  let earnedTaxCredit = calculatedTax <= 1300000
    ? calculatedTax * 0.55
    : 715000 + (calculatedTax - 1300000) * 0.3;
  earnedTaxCredit = Math.min(earnedTaxCredit, earnedIncomeTaxCreditLimit(annual));

  const annualIncomeTax = Math.max(calculatedTax - earnedTaxCredit, 0);
  const annualLocalTax = annualIncomeTax * 0.1;
  const monthlyIncomeTax = annualIncomeTax / 12;
  const monthlyLocalTax = annualLocalTax / 12;

  const monthlyDeductionTotal = monthlyInsurance + monthlyIncomeTax + monthlyLocalTax;
  const monthlyNet = monthlyGross - monthlyDeductionTotal;

  return {
    monthlyGross, nationalPension, healthInsurance, longTermCare, employment,
    monthlyInsurance, monthlyIncomeTax, monthlyLocalTax, monthlyDeductionTotal,
    monthlyNet, annualNet: monthlyNet * 12, bracketRate: taxBracketRate(taxBase)
  };
}

function recalc(){
  const annual = Number(document.getElementById('sl-salary').value.replace(/,/g, ''));
  const dependents = Math.max(parseInt(document.getElementById('sl-dependents').value) || 1, 1);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  if (!annual){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">연봉을 입력해 주세요</td></tr>';
    return;
  }

  const r = calcSalary(annual, dependents);

  miniScreen.textContent = fmt0(r.monthlyNet) + '원';
  miniScreenSub.textContent = '월 실수령액';

  statBody.innerHTML = `
    <tr><th>월 급여 (세전)</th><td>${fmt0(r.monthlyGross)}원</td></tr>
    <tr><th>국민연금(4.75%)</th><td>-${fmt0(r.nationalPension)}원</td></tr>
    <tr><th>건강보험(3.595%)</th><td>-${fmt0(r.healthInsurance)}원</td></tr>
    <tr><th>장기요양보험(13.14%)</th><td>-${fmt0(r.longTermCare)}원</td></tr>
    <tr><th>고용보험(0.9%)</th><td>-${fmt0(r.employment)}원</td></tr>
    <tr><th>소득세(${r.bracketRate}% 구간)</th><td>-${fmt0(r.monthlyIncomeTax)}원</td></tr>
    <tr><th>지방소득세(10%)</th><td>-${fmt0(r.monthlyLocalTax)}원</td></tr>
    <tr><th>공제액 합계</th><td>-${fmt0(r.monthlyDeductionTotal)}원</td></tr>
    <tr class="stat-highlight"><th>월 실수령액</th><td>${fmt0(r.monthlyNet)}원</td></tr>
    <tr><th>연 실수령액</th><td>${fmt0(r.annualNet)}원</td></tr>
  `;
}

document.getElementById('sl-salary').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('sl-salary').value = (40000000).toLocaleString('ko-KR');
document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ addAmount('sl-salary', Number(btn.dataset.add)); recalc(); });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{ resetAmount('sl-salary'); recalc(); });
document.getElementById('sl-dependents').addEventListener('input', recalc);

recalc();
