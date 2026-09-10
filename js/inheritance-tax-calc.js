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

document.querySelectorAll('.seg-toggle[data-target="spouse"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="spouse"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function recalc(){
  const realEstate = Math.max(0, parseFloat(document.getElementById('iht-realestate').value.replace(/,/g, '')) || 0);
  const financial = Math.max(0, parseFloat(document.getElementById('iht-financial').value.replace(/,/g, '')) || 0);
  const hasSpouse = toggleDefault('spouse') === 'yes';
  const children = Math.max(0, Math.floor(parseFloat(document.getElementById('iht-children').value) || 0));

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

  // 기초공제(2억)+인적공제(자녀공제) 합계 vs 일괄공제(5억) 중 큰 금액 선택
  const personalTotal = BASIC_DEDUCTION + children * CHILD_DEDUCTION;
  const usedLumpSum = LUMP_SUM_DEDUCTION >= personalTotal;
  const groupDeduction = Math.max(personalTotal, LUMP_SUM_DEDUCTION);

  // 배우자공제: 배우자가 법정상속분(민법 §1009, 배우자 1.5 : 자녀 각 1)만큼 상속받았다고 가정
  let spouseDeduction = 0;
  if (hasSpouse){
    const spouseShareRatio = 1.5 / (1.5 + children);
    const spouseEstimate = estate * spouseShareRatio;
    spouseDeduction = Math.min(SPOUSE_MAX_DEDUCTION, Math.max(SPOUSE_MIN_DEDUCTION, spouseEstimate));
  }

  // 금융재산상속공제: 입력한 금융재산 전액을 순금융재산으로 간주(금융채무 차감 없음)
  const finDeduction = financialDeduction(financial);

  const totalDeduction = groupDeduction + spouseDeduction + finDeduction;
  const base = Math.max(0, estate - totalDeduction);
  const { rate, deduction: progDeduction, tax } = calcTax(base);

  miniScreen.textContent = fmt(tax) + '원';
  miniScreenSub.textContent = '상속세 산출세액(추정)';
  meta.textContent = `상속재산 ${fmt(estate)}원 · 배우자 ${hasSpouse ? '있음' : '없음'} · 자녀 ${children}명`;

  statBody.innerHTML = `
    <tr><th>부동산 가액</th><td>${fmt(realEstate)}원</td></tr>
    <tr><th>금융재산 가액</th><td>${fmt(financial)}원</td></tr>
    <tr class="stat-highlight"><th>총 상속재산가액</th><td>${fmt(estate)}원</td></tr>
    <tr><th>기초+인적공제 / 일괄공제 중 선택</th><td>${fmt(groupDeduction)}원 (${usedLumpSum ? '일괄공제 5억' : '기초+인적공제'})</td></tr>
    <tr><th>배우자공제</th><td>${fmt(spouseDeduction)}원</td></tr>
    <tr><th>금융재산상속공제</th><td>${fmt(finDeduction)}원</td></tr>
    <tr class="stat-highlight"><th>과세표준</th><td>${fmt(base)}원</td></tr>
    <tr><th>적용 세율 / 누진공제액</th><td>${(rate * 100).toFixed(0)}% / ${fmt(progDeduction)}원</td></tr>
    <tr class="stat-highlight"><th>상속세 산출세액(추정)</th><td>${fmt(tax)}원</td></tr>
  `;

  UrlState.sync({ realEstate, financial, spouse: hasSpouse ? 'yes' : 'no', children }, URL_DEFAULTS);
}

document.getElementById('iht-realestate').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('iht-financial').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('iht-children').addEventListener('input', recalc);

const URL_DEFAULTS = { realEstate: '600000000', financial: '200000000', spouse: 'yes', children: '1' };

const urlParams = UrlState.read();
document.getElementById('iht-realestate').value = Number(urlParams.realEstate || URL_DEFAULTS.realEstate).toLocaleString('ko-KR');
document.getElementById('iht-financial').value = Number(urlParams.financial || URL_DEFAULTS.financial).toLocaleString('ko-KR');
document.getElementById('iht-children').value = urlParams.children || URL_DEFAULTS.children;
if (urlParams.spouse) clickToggle('spouse', urlParams.spouse);

recalc();
