let region = 'regulated';
let firstTime = 'no';
let rateType = 'variable';

// 2025.10.15 주택시장 안정화 대책(10.16 시행) 기준
// regulated: 규제지역(서울 전역·경기 12곳) / metro: 수도권 비규제지역 / local: 지방
const LTV = {
  regulated: { no: 40, yes: 70 },
  metro:     { no: 70, yes: 70 },
  local:     { no: 70, yes: 80 }
};
const REGION_LABEL = { regulated: '규제지역', metro: '수도권 비규제지역', local: '지방' };
// 스트레스 DSR: 수도권·규제지역 주담대 3.0%(3단계 비율), 지방 주담대 0.75%(2단계 비율 유지)
const STRESS = {
  capital: { base: 3.0, ratio: { variable: 1, mixed: 0.8, periodic: 0.4, fixed: 0 } },
  local:   { base: 0.75, ratio: { variable: 1, mixed: 0.6, periodic: 0.3, fixed: 0 } }
};
const RATE_TYPE_LABEL = { variable: '변동금리', mixed: '혼합형', periodic: '주기형', fixed: '순수 고정금리' };

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
// 화면 표시용 퍼센트: 소수점 둘째 자리 반올림, 뒤 0 생략 (0.225 → 0.23)
function pct(n){ return String(Math.round(n * 100 + 1e-9) / 100); }

function getLtvRate(region, firstTime){
  return LTV[region][firstTime];
}

// 수도권·규제지역 주택구입목적 주담대 한도: 시가 15억 이하 6억, 25억 이하 4억, 25억 초과 2억
function priceCap(price){
  if (price <= 1500000000) return { amount: 600000000, label: '15억원 이하 주택' };
  if (price <= 2500000000) return { amount: 400000000, label: '15억 초과 25억원 이하 주택' };
  return { amount: 200000000, label: '25억원 초과 주택' };
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
      if (group.dataset.target === 'rateType') rateType = btn.dataset.value;
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

  const regionLabel = REGION_LABEL[region];
  const firstTimeLabel = firstTime === 'yes' ? '생애최초' : '생애최초 아님';
  meta.textContent = `주택가격 ${fmt(price)}원 · ${regionLabel} · ${firstTimeLabel}`;

  const ltvRate = getLtvRate(region, firstTime);
  const ltvAmount = price * ltvRate / 100;
  const capApplies = region !== 'local';   // 수도권 전체 + 규제지역
  const cap = priceCap(price);

  const monthlyRate = rate / 100 / 12;
  const months = period * 12;
  const periodCapped = capApplies && period > 30;
  const effectiveMonths = periodCapped ? 360 : months;

  // DSR은 실제 금리에 스트레스 금리를 더한 금리로 원리금을 계산해 한도를 구함
  const stress = STRESS[capApplies ? 'capital' : 'local'];
  const stressAdd = stress.base * stress.ratio[rateType];
  const dsrRate = rate + stressAdd;
  const availableAnnualPI = Math.max(0, income * 0.40 - existing);
  const dsrAmount = maxPrincipalEqualPI(availableAnnualPI / 12, dsrRate / 100 / 12, effectiveMonths);

  const limits = [
    { name: 'LTV 기준', amount: ltvAmount },
    ...(capApplies ? [{ name: '주택가격별 한도', amount: cap.amount }] : []),
    { name: 'DSR 기준', amount: dsrAmount }
  ];
  const binding = limits.reduce((a, b) => b.amount < a.amount ? b : a);
  const finalAmount = binding.amount;
  const bottleneck = binding.name;

  const requiredCash = Math.max(0, price - finalAmount);
  const finalMonthly = monthlyPaymentEqualPI(finalAmount, monthlyRate, effectiveMonths);

  miniScreen.textContent = fmt(finalAmount) + '원';
  miniScreenSub.textContent = `병목: ${bottleneck}`;

  statBody.innerHTML = `
    <tr><th>LTV 기준 (${ltvRate}%)</th><td>${fmt(ltvAmount)}원</td></tr>
    <tr><th>주택가격별 한도</th><td>${capApplies ? `${fmt(cap.amount)}원` : '해당 없음 (지방)'}</td></tr>
    ${periodCapped ? `<tr><th>대출 기간</th><td>30년 (수도권·규제지역 만기 한도)</td></tr>` : ''}
    <tr><th>스트레스 금리</th><td>+${pct(stressAdd)}%</td></tr>
    <tr><th>DSR 계산 금리</th><td>${pct(rate + stressAdd)}%</td></tr>
    <tr><th>DSR 기준 (40%)</th><td>${fmt(dsrAmount)}원</td></tr>
    <tr class="stat-highlight"><th>최종 대출 가능액</th><td>${fmt(finalAmount)}원</td></tr>
    <tr><th>병목 사유</th><td>${bottleneck}</td></tr>
    <tr><th>필요 자기자금</th><td>${fmt(requiredCash)}원</td></tr>
    <tr><th>예상 월 상환액</th><td>${fmt(finalMonthly)}원</td></tr>
  `;

  const roundedIncome = Math.round(income);
  document.getElementById('nextDsrDti').href = `dsr-dti-calculator?income=${roundedIncome}`;
  document.getElementById('nextJeonse').href = `jeonse-calculator?mode=butim&bIncome=${roundedIncome}`;
  document.getElementById('nextSalary').href = `salary-calculator?mode=annual&salary=${roundedIncome}`;

  UrlState.sync({
    price, region, firstTime, rateType, income, existing, rate: document.getElementById('m-rate').value, period
  }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  price: '1000000000',
  region: toggleDefault('region'),
  firstTime: toggleDefault('firstTime'),
  rateType: toggleDefault('rateType'),
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
// 예전 공유 링크의 region=normal(비규제지역·지방)은 지방으로 연결
if (urlParams.region) clickToggle('region', urlParams.region === 'normal' ? 'local' : urlParams.region);
if (urlParams.rateType) clickToggle('rateType', urlParams.rateType);
if (urlParams.firstTime) clickToggle('firstTime', urlParams.firstTime);

recalc();
