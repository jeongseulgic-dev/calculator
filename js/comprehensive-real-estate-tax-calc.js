const BRACKETS_2 = [
  { limit: 300000000, rate: 0.005, deduction: 0 },
  { limit: 600000000, rate: 0.007, deduction: 600000 },
  { limit: 1200000000, rate: 0.01, deduction: 2400000 },
  { limit: 2500000000, rate: 0.013, deduction: 6000000 },
  { limit: 5000000000, rate: 0.015, deduction: 11000000 },
  { limit: 9400000000, rate: 0.02, deduction: 36000000 },
  { limit: Infinity, rate: 0.027, deduction: 101800000 }
];

const BRACKETS_3 = [
  { limit: 300000000, rate: 0.005, deduction: 0 },
  { limit: 600000000, rate: 0.007, deduction: 600000 },
  { limit: 1200000000, rate: 0.01, deduction: 2400000 },
  { limit: 2500000000, rate: 0.02, deduction: 14400000 },
  { limit: 5000000000, rate: 0.03, deduction: 39400000 },
  { limit: 9400000000, rate: 0.04, deduction: 89400000 },
  { limit: Infinity, rate: 0.05, deduction: 183400000 }
];

const DEDUCTION_ONE_HOUSE = 1200000000;
const DEDUCTION_OTHERS = 900000000;
const FAIR_MARKET_RATIO = 0.6;
const CREDIT_CAP = 0.8;
// 공제할 재산세액(종부세법 시행령 §4의3①): 종부세 과세표준 × 재산세 공정시장가액비율 × 재산세 표준세율.
// 재산세 비율은 지방세법 시행령 §109①2: 주택 60%, 2026년 1세대1주택은 시가표준액 6억 초과 45%
// (종부세 대상 1주택은 공시가격 12억 초과라 항상 45%).
// 종부세 과세표준은 공시가격 중 공제액을 넘는 윗부분이라 재산세 최고 표준세율 0.4%가 적용되는 구간으로 본다.
const PROPERTY_TAX_RATIO = 0.6;
const PROPERTY_TAX_RATIO_ONE_HOUSE = 0.45;
const PROPERTY_TAX_TOP_RATE = 0.004;
const RURAL_TAX_RATE = 0.2;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function calcTax(base, brackets){
  if (base <= 0) return { rate: 0, deduction: 0, tax: 0 };
  const b = brackets.find(b => base <= b.limit);
  const tax = Math.max(0, base * b.rate - b.deduction);
  return { rate: b.rate, deduction: b.deduction, tax };
}

function ageCreditRate(age){
  if (age >= 70) return 0.4;
  if (age >= 65) return 0.3;
  if (age >= 60) return 0.2;
  return 0;
}

function holdCreditRate(years){
  if (years >= 15) return 0.5;
  if (years >= 10) return 0.4;
  if (years >= 5) return 0.2;
  return 0;
}

document.querySelectorAll('.seg-toggle[data-target="houses"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="houses"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    updateConditionalFields();
    recalc();
  });
});

function updateConditionalFields(){
  const isOne = toggleDefault('houses') === 'one';
  document.getElementById('crt-age-field').classList.toggle('hidden', !isOne);
  document.getElementById('crt-years-field').classList.toggle('hidden', !isOne);
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const priceSum = parseFloat(document.getElementById('crt-price').value.replace(/,/g, ''));
  const houses = toggleDefault('houses');
  const age = parseFloat(document.getElementById('crt-age').value) || 0;
  const years = parseFloat(document.getElementById('crt-years').value) || 0;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(priceSum) || priceSum < 0){
    fail('공시가격 합계(0 이상)를 입력해 주세요');
    return;
  }

  const isOne = houses === 'one';
  const deduction = isOne ? DEDUCTION_ONE_HOUSE : DEDUCTION_OTHERS;
  const taxBase = Math.max(0, priceSum - deduction) * FAIR_MARKET_RATIO;
  const brackets = houses === 'three' ? BRACKETS_3 : BRACKETS_2;
  const { rate, deduction: progDeduction, tax } = calcTax(taxBase, brackets);
  const propertyTaxCredit = Math.min(tax, taxBase * (isOne ? PROPERTY_TAX_RATIO_ONE_HOUSE : PROPERTY_TAX_RATIO) * PROPERTY_TAX_TOP_RATE);
  const afterPropertyTax = tax - propertyTaxCredit;

  let creditRate = 0, credit = 0;
  if (isOne){
    creditRate = Math.min(CREDIT_CAP, ageCreditRate(age) + holdCreditRate(years));
    credit = afterPropertyTax * creditRate;
  }
  const afterCredit = afterPropertyTax - credit;
  const ruralTax = afterCredit * RURAL_TAX_RATE;
  const total = afterCredit + ruralTax;

  const houseLabel = houses === 'one' ? '1주택(1세대1주택)' : houses === 'two' ? '2주택' : '3주택 이상';

  miniScreen.textContent = fmt(total) + '원';
  miniScreenSub.textContent = '종부세 + 농어촌특별세(세부담상한 적용 전, 추정)';
  meta.textContent = `공시가격 합계 ${fmt(priceSum)}원 · ${houseLabel}`;

  statBody.innerHTML = `
    <tr><th>공시가격 합계</th><td>${fmt(priceSum)}원</td></tr>
    <tr><th>소유 주택 수</th><td>${houseLabel}</td></tr>
    <tr><th>기본공제</th><td>${fmt(deduction)}원</td></tr>
    <tr class="stat-highlight"><th>과세표준(공정시장가액비율 60%)</th><td>${fmt(taxBase)}원</td></tr>
    <tr><th>적용 세율 / 누진공제액</th><td>${(rate * 100).toFixed(1)}% / ${fmt(progDeduction)}원</td></tr>
    <tr><th>세율 적용 세액</th><td>${fmt(tax)}원</td></tr>
    <tr><th>공제할 재산세액(재산세 비율 ${isOne ? 45 : 60}%)</th><td>${propertyTaxCredit > 0 ? '-' : ''}${fmt(propertyTaxCredit)}원</td></tr>
    ${isOne ? `<tr><th>고령자·장기보유 세액공제</th><td>${(creditRate * 100).toFixed(0)}% (-${fmt(credit)}원)</td></tr>` : ''}
    <tr><th>종합부동산세</th><td>${fmt(afterCredit)}원</td></tr>
    <tr><th>농어촌특별세(종부세의 20%)</th><td>${fmt(ruralTax)}원</td></tr>
    <tr class="stat-highlight"><th>합계(세부담상한 적용 전, 추정)</th><td>${fmt(total)}원</td></tr>
  `;

  UrlState.sync({ price: priceSum, houses, age, years }, URL_DEFAULTS);
}

document.getElementById('crt-price').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('crt-age').addEventListener('input', recalc);
document.getElementById('crt-years').addEventListener('input', recalc);

const URL_DEFAULTS = {
  price: '1500000000',
  houses: toggleDefault('houses'),
  age: document.getElementById('crt-age').defaultValue,
  years: document.getElementById('crt-years').defaultValue
};

const urlParams = UrlState.read();
document.getElementById('crt-price').value = Number(urlParams.price || URL_DEFAULTS.price).toLocaleString('ko-KR');
if (urlParams.age) document.getElementById('crt-age').value = urlParams.age;
if (urlParams.years) document.getElementById('crt-years').value = urlParams.years;
if (urlParams.houses) clickToggle('houses', urlParams.houses);
updateConditionalFields();

recalc();
