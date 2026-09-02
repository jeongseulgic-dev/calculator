const BRACKETS = [
  { limit: 100000000, rate: 0.10, deduction: 0 },
  { limit: 500000000, rate: 0.20, deduction: 10000000 },
  { limit: 1000000000, rate: 0.30, deduction: 60000000 },
  { limit: 3000000000, rate: 0.40, deduction: 160000000 },
  { limit: Infinity, rate: 0.50, deduction: 460000000 }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function calcTax(base){
  if (base <= 0) return { rate: 0, deduction: 0, tax: 0 };
  const b = BRACKETS.find(b => base <= b.limit);
  const tax = Math.max(0, base * b.rate - b.deduction);
  return { rate: b.rate, deduction: b.deduction, tax };
}

document.querySelectorAll('.seg-toggle[data-target="spouse"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="spouse"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function recalc(){
  const estate = parseFloat(document.getElementById('iht-estate').value.replace(/,/g, ''));
  const hasSpouse = toggleDefault('spouse') === 'yes';

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(estate) || estate < 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">상속재산가액(0 이상)을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const deduction = hasSpouse ? 1000000000 : 500000000;
  const base = Math.max(0, estate - deduction);
  const { rate, deduction: progDeduction, tax } = calcTax(base);

  miniScreen.textContent = fmt(tax) + '원';
  miniScreenSub.textContent = '상속세 산출세액(추정)';
  meta.textContent = `상속재산 ${fmt(estate)}원 · 배우자 ${hasSpouse ? '있음' : '없음'}`;

  statBody.innerHTML = `
    <tr><th>상속재산가액</th><td>${fmt(estate)}원</td></tr>
    <tr><th>상속공제(배우자 ${hasSpouse ? '있음: 10억' : '없음: 5억'})</th><td>${fmt(deduction)}원</td></tr>
    <tr class="stat-highlight"><th>과세표준</th><td>${fmt(base)}원</td></tr>
    <tr><th>적용 세율 / 누진공제액</th><td>${(rate * 100).toFixed(0)}% / ${fmt(progDeduction)}원</td></tr>
    <tr class="stat-highlight"><th>상속세 산출세액(추정)</th><td>${fmt(tax)}원</td></tr>
  `;

  UrlState.sync({ estate, spouse: hasSpouse ? 'yes' : 'no' }, URL_DEFAULTS);
}

document.getElementById('iht-estate').addEventListener('input', function(){ formatInputComma(this); recalc(); });

const URL_DEFAULTS = { estate: '800000000', spouse: 'yes' };

const urlParams = UrlState.read();
document.getElementById('iht-estate').value = Number(urlParams.estate || URL_DEFAULTS.estate).toLocaleString('ko-KR');
if (urlParams.spouse) clickToggle('spouse', urlParams.spouse);

recalc();
