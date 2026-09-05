let region = 'regulated';
let firstTime = 'no';

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function getLtvRate(region, firstTime){
  if (firstTime === 'yes') return region === 'regulated' ? 70 : 80;
  return region === 'regulated' ? 50 : 70;
}

function maxPrincipalEqualPI(monthlyPayment, monthlyRate, months){
  if (monthlyPayment <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return monthlyPayment * months;
  return monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months));
}

function monthlyPaymentEqualPI(P, monthlyRate, months){
  if (months <= 0) return 0;
  if (monthlyRate === 0) return P / months;
  return P * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
}

document.getElementById('m-price').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('m-price', Number(btn.dataset.add));
    recalc();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('m-price');
  recalc();
});

document.getElementById('m-income').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('m-existing').addEventListener('input', function(){ formatInputComma(this); recalc(); });
['m-rate', 'm-period'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'region') region = btn.dataset.value;
      if (group.dataset.target === 'firstTime') firstTime = btn.dataset.value;
      recalc();
    });
  });
});

function recalc(){
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  const price = parseFloat(document.getElementById('m-price').value.replace(/,/g,''));
  const income = parseFloat(document.getElementById('m-income').value.replace(/,/g,''));
  const existing = parseFloat(document.getElementById('m-existing').value.replace(/,/g,'')) || 0;
  const rate = parseFloat(document.getElementById('m-rate').value);
  const period = parseFloat(document.getElementById('m-period').value);

  if (!price || price <= 0 || !income || income <= 0 || isNaN(rate) || !period || period <= 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">주택가격·연소득·금리·기간을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const regionLabel = region === 'regulated' ? '수도권·규제지역' : '비규제지역·지방';
  const firstTimeLabel = firstTime === 'yes' ? '생애최초' : '생애최초 아님';
  meta.textContent = `주택가격 ${fmt(price)}원 · ${regionLabel} · ${firstTimeLabel}`;

  const ltvRate = getLtvRate(region, firstTime);
  const ltvAmount = price * ltvRate / 100;
  const capApplies = region === 'regulated';
  const capAmount = capApplies ? Math.min(ltvAmount, 600000000) : ltvAmount;

  const monthlyRate = rate / 100 / 12;
  const months = period * 12;
  const availableAnnualPI = Math.max(0, income * 0.40 - existing);
  const dsrAmount = maxPrincipalEqualPI(availableAnnualPI / 12, monthlyRate, months);

  const finalAmount = Math.min(capAmount, dsrAmount);

  let bottleneck;
  if (finalAmount >= capAmount && finalAmount <= dsrAmount){
    bottleneck = capApplies && ltvAmount > 600000000 ? '6억원 한도' : 'LTV 기준';
  } else {
    bottleneck = 'DSR(은행권 40%) 기준';
  }

  const requiredCash = Math.max(0, price - finalAmount);
  const finalMonthly = monthlyPaymentEqualPI(finalAmount, monthlyRate, months);

  miniScreen.textContent = fmt(finalAmount) + '원';
  miniScreenSub.textContent = `병목: ${bottleneck}`;

  statBody.innerHTML = `
    <tr><th>LTV 기준</th><td>${ltvRate}% · ${fmt(ltvAmount)}원</td></tr>
    <tr><th>대출 한도 제한</th><td>${capApplies ? (ltvAmount > 600000000 ? `6억원 한도 적용` : '6억원 이내 (해당 없음)') : '해당 없음(비규제지역)'}</td></tr>
    <tr><th>DSR(은행권 40%) 기준</th><td>${fmt(dsrAmount)}원</td></tr>
    <tr class="stat-highlight"><th>최종 대출 가능액</th><td>${fmt(finalAmount)}원</td></tr>
    <tr><th>병목 사유</th><td>${bottleneck}</td></tr>
    <tr><th>필요 자기자금</th><td>${fmt(requiredCash)}원</td></tr>
    <tr><th>참고: 월 상환액(원리금균등)</th><td>${fmt(finalMonthly)}원</td></tr>
  `;

  const roundedIncome = Math.round(income);
  document.getElementById('nextDsrDti').href = `dsr-dti-calculator?income=${roundedIncome}`;
  document.getElementById('nextJeonse').href = `jeonse-calculator?mode=butim&bIncome=${roundedIncome}`;

  UrlState.sync({
    price, region, firstTime, income, existing, rate: document.getElementById('m-rate').value, period
  }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  price: '1000000000',
  region: toggleDefault('region'),
  firstTime: toggleDefault('firstTime'),
  income: '80000000',
  existing: '5000000',
  rate: document.getElementById('m-rate').defaultValue,
  period: document.getElementById('m-period').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.price) document.getElementById('m-price').value = Number(urlParams.price).toLocaleString('ko-KR');
if (urlParams.income) document.getElementById('m-income').value = Number(urlParams.income).toLocaleString('ko-KR');
if (urlParams.existing) document.getElementById('m-existing').value = Number(urlParams.existing).toLocaleString('ko-KR');
if (urlParams.rate) document.getElementById('m-rate').value = urlParams.rate;
if (urlParams.period) document.getElementById('m-period').value = urlParams.period;
if (urlParams.region) clickToggle('region', urlParams.region);
if (urlParams.firstTime) clickToggle('firstTime', urlParams.firstTime);

recalc();
