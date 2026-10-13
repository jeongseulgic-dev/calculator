// ===== 연봉 실수령액 (salary-calc.js와 동일) =====
const RATE = { nationalPension: 0.0475, healthInsurance: 0.03595, longTermCare: 0.1314, employment: 0.009, npFloor: 410000, npCeil: 6590000 };
const MEAL_NONTAX_CAP = 200000;

function earnedIncomeDeduction(a){
  if (a <= 5000000) return a * 0.7;
  if (a <= 15000000) return 3500000 + (a - 5000000) * 0.4;
  if (a <= 45000000) return 7500000 + (a - 15000000) * 0.15;
  if (a <= 100000000) return 12000000 + (a - 45000000) * 0.05;
  return 14750000 + (a - 100000000) * 0.02;
}
function progressiveTax(b){
  if (b <= 14000000) return b * 0.06;
  if (b <= 50000000) return b * 0.15 - 1260000;
  if (b <= 88000000) return b * 0.24 - 5760000;
  if (b <= 150000000) return b * 0.35 - 15440000;
  if (b <= 300000000) return b * 0.38 - 19940000;
  if (b <= 500000000) return b * 0.40 - 25940000;
  if (b <= 1000000000) return b * 0.42 - 35940000;
  return b * 0.45 - 65940000;
}
function earnedIncomeTaxCreditLimit(a){
  if (a <= 33000000) return 740000;
  if (a <= 70000000) return Math.max(740000 - (a - 33000000) * 0.008, 660000);
  return Math.max(660000 - (a - 70000000) * 0.5, 500000);
}
function monthlyNetPay(annual){
  const monthlyGross = annual / 12;
  const nontax = Math.min(MEAL_NONTAX_CAP, monthlyGross);
  const taxable = monthlyGross - nontax;
  const np = Math.round(Math.min(Math.max(taxable, RATE.npFloor), RATE.npCeil) * RATE.nationalPension);
  const hi = Math.round(taxable * RATE.healthInsurance);
  const ltc = Math.round(hi * RATE.longTermCare);
  const emp = Math.round(taxable * RATE.employment);
  const annualTaxable = annual - nontax * 12;
  const earnedIncome = Math.max(annualTaxable - earnedIncomeDeduction(annualTaxable), 0);
  const base = Math.max(earnedIncome - (1500000 + np * 12 + (hi + ltc + emp) * 12), 0);
  const calcTax = Math.max(progressiveTax(base), 0);
  let credit = calcTax <= 1300000 ? calcTax * 0.55 : 715000 + (calcTax - 1300000) * 0.3;
  credit = Math.min(credit, earnedIncomeTaxCreditLimit(annual));
  const incomeTax = Math.max(calcTax - credit, 0);
  return monthlyGross - (np + hi + ltc + emp) - incomeTax * 1.1 / 12;
}

// ===== 퇴직금 (severance-pay-calc.js와 동일) =====
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
function taxServiceYears(start, retireDate){
  let y = retireDate.getFullYear() - start.getFullYear();
  if (new Date(start.getFullYear() + y, start.getMonth(), start.getDate()) > retireDate) y--;
  const rem = new Date(start.getFullYear() + y, start.getMonth(), start.getDate()) < retireDate;
  return Math.max(1, y + (rem ? 1 : 0));
}
function severanceNet(wage, start, retireDate, serviceDays){
  if (serviceDays < 365) return { gross: 0, net: 0 };
  const periodStart = new Date(retireDate.getFullYear(), retireDate.getMonth() - 3, Math.min(retireDate.getDate(), new Date(retireDate.getFullYear(), retireDate.getMonth() - 2, 0).getDate()));
  const periodDays = Math.round((retireDate - periodStart) / 86400000);
  const gross = wage * 3 / periodDays * 30 * (serviceDays / 365);
  const taxYears = taxServiceYears(start, retireDate);
  const conv = Math.max(0, gross - TENURE_DEDUCT.find(r => taxYears <= r.years).calc(taxYears)) * 12 / taxYears;
  const cd = conv <= 0 ? 0 : CONV_DEDUCT.find(r => conv <= r.limit).calc(conv);
  const tax = Math.max(progressiveTax(Math.max(0, conv - cd)), 0) / 12 * taxYears * 1.1;
  return { gross, net: gross - tax };
}

// ===== 실업급여 (unemployment-benefit-calc.js와 동일) =====
const UPPER_DAILY = 68100, LOWER_DAILY = 66048, WAITING_DAYS = 7;
// 조기재취업수당: 고용보험법 제64조·시행령 제84조. 제외 임금액은 고용24 안내 기준(2024년 고시액).
const EARLY_MIN_DAYS_AFTER_CLAIM = 14;
const EARLY_EXCLUDE_MONTHLY_WAGE = 5740000;
const DAYS_TABLE = [
  { months: 12, under50: 120, over50: 120 },
  { months: 36, under50: 150, over50: 180 },
  { months: 60, under50: 180, over50: 210 },
  { months: 120, under50: 210, over50: 240 },
  { months: Infinity, under50: 240, over50: 270 }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
function num(id){ return parseFloat(document.getElementById(id).value.replace(/,/g, '')); }
function toInputValue(d){ return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function man(n){ const m = n / 10000; return Number.isInteger(m) ? m.toLocaleString('ko-KR') + '만원' : fmt(n) + '원'; }
function sub(t){ return t ? `<span class="sim-sub">${t}</span>` : ''; }
function row(th, td, o = {}){
  const value = td.replace(/([가-힣]+)/g, '<span class="sim-ko">$1</span>');
  return `<tr${o.hl ? ' class="stat-highlight"' : ''}><th>${th}${sub(o.thSub)}</th><td>${value}${sub(o.tdSub)}</td></tr>`;
}

function setEmpty(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('cashBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('gapBody').innerHTML = '';
  document.getElementById('moveBody').innerHTML = '';
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const wage = num('js-wage');
  const start = parseIsoDate(document.getElementById('js-start').value);
  const end = parseIsoDate(document.getElementById('js-end').value);
  const age = parseFloat(document.getElementById('js-age').value);
  const gapMonths = Math.max(0, parseFloat(document.getElementById('js-gap').value) || 0);
  const newSalary = num('js-new');
  const receivesUb = toggleDefault('ub') === 'yes';

  if (!(wage > 0) || !start || !end || !(age > 0)){
    setEmpty('월급·입사일·마지막 근무일·나이를 입력해 주세요');
    return;
  }
  if (end < start){
    setEmpty('마지막 근무일은 입사일과 같거나 뒤여야 합니다');
    return;
  }

  // 퇴직일 = 마지막 근무일 다음 날 (퇴직금 계산기와 동일)
  const retireDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  const serviceDays = Math.round((retireDate - start) / 86400000);
  const sev = severanceNet(wage, start, retireDate, serviceDays);

  const insuredMonths = serviceDays / 365 * 12;
  const eligible = receivesUb;
  const daily = Math.max(LOWER_DAILY, Math.min(UPPER_DAILY, wage * 3 / 90 * 0.6));
  const dayRow = DAYS_TABLE.find(r => insuredMonths < r.months);
  const entitledDays = eligible ? (age >= 50 ? dayRow.over50 : dayRow.under50) : 0;
  const gapDays = Math.round(gapMonths * 30);
  const paidDays = Math.min(entitledDays, Math.max(0, gapDays - WAITING_DAYS));
  const ubReceived = daily * paidDays;

  const reemployed = newSalary > 0;
  const remainingDays = entitledDays - paidDays;
  let earlyBonus = 0, earlyExcluded = '';
  if (eligible && reemployed && remainingDays >= entitledDays / 2){
    if (gapDays <= EARLY_MIN_DAYS_AFTER_CLAIM) earlyExcluded = '실업 신고 후 14일 이내 재취업은 제외';
    else if (newSalary / 12 >= EARLY_EXCLUDE_MONTHLY_WAGE) earlyExcluded = '재취업 월급 574만원 이상은 제외';
    else earlyBonus = daily * remainingDays / 2;
  }

  const total = sev.net + ubReceived + earlyBonus;
  const curNet = monthlyNetPay(wage * 12);
  const lostIncome = curNet * gapMonths;
  const coverMonths = curNet > 0 ? total / curNet : 0;

  document.getElementById('miniScreen').textContent = fmt(total) + '원';
  document.getElementById('miniScreenSub').textContent = `지금 월급 ${coverMonths.toFixed(1)}개월분`;
  document.getElementById('page-meta').textContent = `근속 ${(serviceDays / 365).toFixed(1)}년 · 월급 ${fmt(wage)}원 · 공백 ${gapMonths}개월`;

  document.getElementById('cashBody').innerHTML = [
    row('퇴직금', serviceDays < 365 ? '0원' : fmt(sev.net) + '원', { thSub: '세후', tdSub: serviceDays < 365 ? '근속 1년 미만' : '' }),
    row('실업급여', eligible ? fmt(ubReceived) + '원' : '0원', { thSub: '공백기 동안 실제 수령', tdSub: eligible ? `${paidDays}일분` : '받지 않음 선택' }),
    earlyBonus > 0 ? row('조기재취업수당', fmt(earlyBonus) + '원', { thSub: '새 직장 12개월 이상 근속 시' }) : '',
    earlyExcluded ? row('조기재취업수당', '0원', { tdSub: earlyExcluded }) : '',
    row('합계', fmt(total) + '원', { hl: true })
  ].join('');

  document.getElementById('gapBody').innerHTML = [
    eligible ? row('실업급여 1일액', fmt(daily) + '원') : '',
    eligible ? row('최대 수급 일수', entitledDays + '일') : '',
    eligible ? row('실제 수령 일수', paidDays + '일', { thSub: `공백 ${gapMonths}개월 중, 대기기간 7일 제외`, tdSub: paidDays === entitledDays ? '최대 일수 소진' : '' }) : '',
    row('공백기 동안 못 받는 월급', fmt(lostIncome) + '원', { thSub: '실수령 기준' }),
    row('버틸 수 있는 기간', coverMonths.toFixed(1) + '개월분', { hl: true, thSub: '받는 돈 ÷ 지금 월 실수령액', tdSub: eligible ? '' : '퇴직금만' })
  ].join('');

  if (document.getElementById('tlCash')){
    const newDate = new Date(end.getFullYear(), end.getMonth() + gapMonths, 1);
    newDate.setDate(Math.min(end.getDate(), new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate()));
    const tlDiff = reemployed ? monthlyNetPay(newSalary) - curNet : null;
    document.getElementById('tlEndDate').textContent = toInputValue(end);
    const ko = s => s.replace(/([가-힣]+)/g, '<span class="sim-ko">$1</span>');
    document.getElementById('tlCash').innerHTML = ko(fmt(total) + '원');
    document.getElementById('tlGapLen').textContent = `${gapMonths}개월`;
    document.getElementById('tlCover').innerHTML = ko(`${coverMonths.toFixed(1)}개월분`);
    document.getElementById('tlNewDate').textContent = reemployed ? toInputValue(newDate) : '연봉 미입력';
    document.getElementById('tlDiff').innerHTML = tlDiff === null ? '--' : ko(`월 ${tlDiff >= 0 ? '+' : '−'}${fmt(Math.abs(tlDiff))}원`);
  }

  if (reemployed){
    const newNet = monthlyNetPay(newSalary);
    const diff = newNet - curNet;
    const sign = diff >= 0 ? '+' : '−';
    const shortfall = lostIncome - (ubReceived + earlyBonus);
    let recovery = '';
    if (shortfall <= 0) recovery = row('공백기 손실 회복', '이미 메워짐', { tdSub: '실업급여·조기재취업수당으로' });
    else if (diff > 0) recovery = row('공백기 손실 회복 기간', `약 ${Math.ceil(shortfall / diff)}개월`, { thSub: '늘어난 월급으로 메우는 데 걸리는 기간' });
    document.getElementById('moveBody').innerHTML = [
      row('지금 월 실수령액', fmt(curNet) + '원', { thSub: `연봉 ${man(wage * 12)}` }),
      row('이직 후 월 실수령액', fmt(newNet) + '원', { thSub: `연봉 ${man(newSalary)}` }),
      row('매달 달라지는 금액', `${sign}${fmt(Math.abs(diff))}원`, { hl: true, tdSub: `연 ${sign}${fmt(Math.abs(diff) * 12)}원` }),
      recovery
    ].join('');
  } else {
    document.getElementById('moveBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">옮길 회사 연봉을 입력하면 실수령액을 비교합니다</td></tr>`;
  }

  const startStr = document.getElementById('js-start').value, endStr = document.getElementById('js-end').value;
  document.getElementById('nextSeverance').href = `severance-pay-calculator?start=${startStr}&end=${endStr}&wage=${Math.round(wage)}`;
  document.getElementById('nextUnemployment').href = `unemployment-benefit-calculator?wage=${Math.round(wage)}&age=${age}&months=${Math.floor(insuredMonths)}`;
  document.getElementById('nextSalary').href = reemployed ? `salary-calculator?salary=${Math.round(newSalary)}` : `salary-calculator?salary=${Math.round(wage * 12)}`;

  UrlState.sync({
    wage, age, start: startStr, end: endStr,
    ub: toggleDefault('ub'), gap: gapMonths,
    new: reemployed ? newSalary : 0
  }, URL_DEFAULTS);
}

document.querySelectorAll('.seg-toggle[data-target="ub"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="ub"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});
['js-wage','js-new'].forEach(id => document.getElementById(id).addEventListener('input', function(){ formatInputComma(this); recalc(); }));
['js-age','js-gap'].forEach(id => document.getElementById(id).addEventListener('input', recalc));
attachDateMask('js-start', recalc);
attachDateMask('js-end', recalc);

const today = new Date();
const URL_DEFAULTS = {
  wage: '3500000',
  age: document.getElementById('js-age').defaultValue,
  start: toInputValue(new Date(today.getFullYear() - 4, today.getMonth(), today.getDate())),
  end: toInputValue(today),
  ub: toggleDefault('ub'),
  gap: document.getElementById('js-gap').defaultValue,
  new: '46000000'
};

const urlParams = UrlState.read();
document.getElementById('js-wage').value = Number(urlParams.wage || URL_DEFAULTS.wage).toLocaleString('ko-KR');
document.getElementById('js-age').value = urlParams.age || URL_DEFAULTS.age;
document.getElementById('js-start').value = urlParams.start || URL_DEFAULTS.start;
document.getElementById('js-end').value = urlParams.end || URL_DEFAULTS.end;
document.getElementById('js-gap').value = urlParams.gap || URL_DEFAULTS.gap;
const newParam = urlParams.new || URL_DEFAULTS.new;
document.getElementById('js-new').value = Number(newParam) > 0 ? Number(newParam).toLocaleString('ko-KR') : '';
if (urlParams.ub) clickToggle('ub', urlParams.ub);

recalc();
