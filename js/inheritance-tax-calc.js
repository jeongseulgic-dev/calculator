const BRACKETS = [
  { limit: 100000000, rate: 0.10, deduction: 0 },
  { limit: 500000000, rate: 0.20, deduction: 10000000 },
  { limit: 1000000000, rate: 0.30, deduction: 60000000 },
  { limit: 3000000000, rate: 0.40, deduction: 160000000 },
  { limit: Infinity, rate: 0.50, deduction: 460000000 }
];

const BASIC_DEDUCTION = 200000000;
const LUMP_SUM_DEDUCTION = 500000000;
const CHILD_DEDUCTION = 50000000;
const SPOUSE_MIN_DEDUCTION = 500000000;
const SPOUSE_MAX_DEDUCTION = 3000000000;
const FIN_DEDUCTION_THRESHOLD = 20000000;
const FIN_DEDUCTION_CAP = 200000000;
const FUNERAL_MIN = 5000000, FUNERAL_MAX = 10000000;   // 상증법 시행령 제9조 (봉안시설 비용 별도)
const COHABIT_HOUSE_CAP = 600000000;                   // 동거주택 상속공제 한도 (상증법 제23조의2)
const FILING_CREDIT_RATE = 0.03;                       // 신고세액공제 (상증법 제69조)

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function calcTax(base){
  if (base <= 0) return { rate: 0, deduction: 0, tax: 0 };
  const b = BRACKETS.find(b => base <= b.limit);
  const tax = Math.max(0, base * b.rate - b.deduction);
  return { rate: b.rate, deduction: b.deduction, tax };
}

function financialDeduction(net){
  if (net <= 0) return 0;
  if (net <= FIN_DEDUCTION_THRESHOLD) return net;
  return Math.min(FIN_DEDUCTION_CAP, Math.max(FIN_DEDUCTION_THRESHOLD, net * 0.2));
}

['spouse', 'cohabit'].forEach(target=>{
  document.querySelectorAll(`.seg-toggle[data-target="${target}"] .seg-btn`).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll(`.seg-toggle[data-target="${target}"] .seg-btn`).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      recalc();
    });
  });
});

function money(id){ return Math.max(0, parseFloat(document.getElementById(id).value.replace(/,/g, '')) || 0); }

function recalc(){
  const realEstate = money('iht-realestate');
  const financial = money('iht-financial');
  const finDebt = money('iht-findebt');
  const otherDebt = money('iht-otherdebt');
  const funeralInput = money('iht-funeral');
  const hasSpouse = toggleDefault('spouse') === 'yes';
  const children = Math.max(0, Math.floor(parseFloat(document.getElementById('iht-children').value) || 0));
  const cohabit = toggleDefault('cohabit') === 'yes';

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  const estate = realEstate + financial;

  if (estate <= 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">부동산·금융재산 가액을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  // 상속세 과세가액 = 상속재산가액 − 채무 − 장례비용 (장례비는 500만원 미만이면 500만원, 최대 1천만원)
  const funeral = Math.min(FUNERAL_MAX, Math.max(FUNERAL_MIN, funeralInput));
  const debts = finDebt + otherDebt;
  const taxableEstate = Math.max(0, estate - debts - funeral);

  // 배우자 단독상속(자녀 없음, 배우자 생존)이면 일괄공제를 적용할 수 없고 기초공제 2억원만 적용 (상증법 제21조 제2항)
  const spouseSole = hasSpouse && children === 0;
  const personalTotal = BASIC_DEDUCTION + children * CHILD_DEDUCTION;
  const usedLumpSum = !spouseSole && LUMP_SUM_DEDUCTION >= personalTotal;
  const groupDeduction = spouseSole ? personalTotal : Math.max(personalTotal, LUMP_SUM_DEDUCTION);
  const groupLabel = spouseSole ? '기초공제 (배우자 단독상속, 일괄공제 불가)' : usedLumpSum ? '일괄공제' : '기초공제 + 자녀공제';

  // 배우자공제: 배우자가 법정상속분(민법 §1009, 배우자 1.5 : 자녀 각 1)만큼 상속받았다고 가정.
  // 한도 계산 기준은 상속재산에서 공과금·채무만 뺀 금액이고 장례비는 빼지 않는다(상증법 시행령 §17①)
  let spouseDeduction = 0;
  if (hasSpouse){
    const spouseShareRatio = 1.5 / (1.5 + children);
    const spouseEstimate = Math.max(0, estate - debts) * spouseShareRatio;
    spouseDeduction = Math.min(SPOUSE_MAX_DEDUCTION, Math.max(SPOUSE_MIN_DEDUCTION, spouseEstimate));
  }

  // 금융재산상속공제: 순금융재산 = 금융재산 − 금융기관 채무
  const netFinancial = Math.max(0, financial - finDebt);
  const finDeduction = financialDeduction(netFinancial);

  // 동거주택 상속공제: 상속인이 직계비속(자녀)이어야 하므로 자녀가 있을 때만. 부동산 가액을 해당 주택으로 간주
  const cohabitDeduction = cohabit && children > 0 ? Math.min(COHABIT_HOUSE_CAP, realEstate) : 0;

  // 상속공제 종합한도: 공제 합계는 과세가액을 넘을 수 없음 (사전증여 없음 가정)
  const rawDeduction = groupDeduction + spouseDeduction + finDeduction + cohabitDeduction;
  const totalDeduction = Math.min(rawDeduction, taxableEstate);
  const base = Math.max(0, taxableEstate - totalDeduction);
  const { rate, deduction: progDeduction, tax } = calcTax(base);
  const filingCredit = tax * FILING_CREDIT_RATE;
  const payable = tax - filingCredit;

  miniScreen.textContent = fmt(payable) + '원';
  miniScreenSub.textContent = tax > 0 ? '기한 내 신고 시 납부세액(추정)' : '납부할 상속세 없음';
  meta.textContent = `상속재산 ${fmt(estate)}원 · 배우자 ${hasSpouse ? '있음' : '없음'} · 자녀 ${children}명`;

  statBody.innerHTML = `
    <tr><th>부동산 가액</th><td>${fmt(realEstate)}원</td></tr>
    <tr><th>금융재산 가액</th><td>${fmt(financial)}원</td></tr>
    <tr><th>총 상속재산가액</th><td>${fmt(estate)}원</td></tr>
    <tr><th>채무</th><td>− ${fmt(debts)}원</td></tr>
    <tr><th>장례비용 (인정액)</th><td>− ${fmt(funeral)}원</td></tr>
    <tr class="stat-highlight"><th>상속세 과세가액</th><td>${fmt(taxableEstate)}원</td></tr>
    <tr><th>${groupLabel}</th><td>${fmt(groupDeduction)}원</td></tr>
    <tr><th>배우자공제</th><td>${fmt(spouseDeduction)}원</td></tr>
    <tr><th>금융재산상속공제</th><td>${fmt(finDeduction)}원</td></tr>
    ${cohabit ? `<tr><th>동거주택 상속공제${children > 0 ? '' : ' (자녀 없음, 적용 불가)'}</th><td>${fmt(cohabitDeduction)}원</td></tr>` : ''}
    <tr><th>상속공제 합계${rawDeduction > taxableEstate ? ' (과세가액 한도)' : ''}</th><td>${fmt(totalDeduction)}원</td></tr>
    <tr class="stat-highlight"><th>과세표준</th><td>${fmt(base)}원</td></tr>
    <tr><th>적용 세율 / 누진공제액</th><td>${(rate * 100).toFixed(0)}% / ${fmt(progDeduction)}원</td></tr>
    <tr><th>산출세액</th><td>${fmt(tax)}원</td></tr>
    <tr><th>신고세액공제 (3%)</th><td>− ${fmt(filingCredit)}원</td></tr>
    <tr class="stat-highlight"><th>납부할 세액(추정)</th><td>${fmt(payable)}원</td></tr>
  `;

  document.getElementById('nextGiftTax').href = `gift-tax-calculator?amount=${Math.round(estate)}`;

  UrlState.sync({ realEstate, financial, finDebt, otherDebt, funeral: funeralInput, spouse: hasSpouse ? 'yes' : 'no', children, cohabit: cohabit ? 'yes' : 'no' }, URL_DEFAULTS);
}

['iht-realestate', 'iht-financial', 'iht-findebt', 'iht-otherdebt', 'iht-funeral'].forEach(id => document.getElementById(id).addEventListener('input', function(){ formatInputComma(this); recalc(); }));
document.getElementById('iht-children').addEventListener('input', recalc);

const URL_DEFAULTS = { realEstate: '600000000', financial: '200000000', finDebt: '0', otherDebt: '0', funeral: '5000000', spouse: 'yes', children: '1', cohabit: 'no' };

const urlParams = UrlState.read();
document.getElementById('iht-realestate').value = Number(urlParams.realEstate || URL_DEFAULTS.realEstate).toLocaleString('ko-KR');
document.getElementById('iht-financial').value = Number(urlParams.financial || URL_DEFAULTS.financial).toLocaleString('ko-KR');
document.getElementById('iht-findebt').value = Number(urlParams.finDebt || URL_DEFAULTS.finDebt).toLocaleString('ko-KR');
document.getElementById('iht-otherdebt').value = Number(urlParams.otherDebt || URL_DEFAULTS.otherDebt).toLocaleString('ko-KR');
document.getElementById('iht-funeral').value = Number(urlParams.funeral || URL_DEFAULTS.funeral).toLocaleString('ko-KR');
document.getElementById('iht-children').value = urlParams.children || URL_DEFAULTS.children;
if (urlParams.spouse) clickToggle('spouse', urlParams.spouse);
if (urlParams.cohabit) clickToggle('cohabit', urlParams.cohabit);

recalc();
