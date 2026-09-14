const BRACKETS = [
  { limit: 100000000, rate: 0.10, deduction: 0 },
  { limit: 500000000, rate: 0.20, deduction: 10000000 },
  { limit: 1000000000, rate: 0.30, deduction: 60000000 },
  { limit: 3000000000, rate: 0.40, deduction: 160000000 },
  { limit: Infinity, rate: 0.50, deduction: 460000000 }
];

const RELATION_DEDUCTION = {
  spouse: 600000000,
  ascendant_adult: 50000000,
  ascendant_minor: 20000000,
  descendant: 50000000,
  other_relative: 10000000,
  stranger: 0
};

const RELATION_LABEL = {
  spouse: '배우자',
  ascendant_adult: '직계존속 → 성년자',
  ascendant_minor: '직계존속 → 미성년자',
  descendant: '직계비속 → 직계존속',
  other_relative: '기타친족',
  stranger: '그 외(타인)'
};

const MARRIAGE_DEDUCTION_CAP = 100000000;
const GENSKIP_MINOR_AMOUNT_THRESHOLD = 2000000000;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function calcTax(base){
  if (base <= 0) return { rate: 0, deduction: 0, tax: 0 };
  const b = BRACKETS.find(b => base <= b.limit);
  const tax = Math.max(0, base * b.rate - b.deduction);
  return { rate: b.rate, deduction: b.deduction, tax };
}

document.getElementById('gt-relation').addEventListener('change', ()=>{
  updateConditionalFields();
  recalc();
});

document.querySelectorAll('.seg-toggle[data-target="marriage"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="marriage"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

document.querySelectorAll('.seg-toggle[data-target="genskip"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="genskip"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function updateConditionalFields(){
  const relation = document.getElementById('gt-relation').value;
  document.getElementById('gt-marriage-field').classList.toggle('hidden', relation !== 'ascendant_adult');
  document.getElementById('gt-genskip-field').classList.toggle('hidden', relation !== 'ascendant_adult' && relation !== 'ascendant_minor');
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const amount = parseFloat(document.getElementById('gt-amount').value.replace(/,/g, ''));
  const relation = document.getElementById('gt-relation').value;
  const prior = parseFloat(document.getElementById('gt-prior').value.replace(/,/g, '')) || 0;
  const marriage = relation === 'ascendant_adult' && toggleDefault('marriage') === 'yes';
  const genskip = (relation === 'ascendant_adult' || relation === 'ascendant_minor') && toggleDefault('genskip') === 'yes';

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(amount) || amount < 0 || prior < 0){
    fail('증여재산가액(0 이상)을 입력해 주세요');
    return;
  }

  const baseDeduction = RELATION_DEDUCTION[relation];
  const marriageDeduction = marriage ? MARRIAGE_DEDUCTION_CAP : 0;
  const totalDeduction = baseDeduction + marriageDeduction;

  const combined = amount + prior;
  const combinedBase = Math.max(0, combined - totalDeduction);
  const { rate, deduction: progDeduction, tax: combinedTax } = calcTax(combinedBase);

  const priorBase = Math.max(0, prior - totalDeduction);
  const priorTax = calcTax(priorBase).tax;

  const thisTax = Math.max(0, combinedTax - priorTax);

  const isMinor = relation === 'ascendant_minor';
  const surtaxRate = genskip ? ((isMinor && amount > GENSKIP_MINOR_AMOUNT_THRESHOLD) ? 1.4 : 1.3) : 1.0;
  const afterSurtax = thisTax * surtaxRate;

  const reportCredit = afterSurtax * 0.03;
  const finalTax = afterSurtax - reportCredit;

  miniScreen.textContent = fmt(finalTax) + '원';
  miniScreenSub.textContent = '납부할 세액(추정)';
  meta.textContent = `증여재산 ${fmt(amount)}원 · ${RELATION_LABEL[relation]}`;

  statBody.innerHTML = `
    <tr><th>증여재산가액</th><td>${fmt(amount)}원</td></tr>
    <tr><th>이전 10년 합산 증여재산가액</th><td>${fmt(prior)}원</td></tr>
    <tr><th>증여재산공제</th><td>${fmt(totalDeduction)}원${marriage ? ' (혼인·출산공제 포함)' : ''}</td></tr>
    <tr class="stat-highlight"><th>합산 과세표준</th><td>${fmt(combinedBase)}원</td></tr>
    <tr><th>적용 세율 / 누진공제액</th><td>${(rate * 100).toFixed(0)}% / ${fmt(progDeduction)}원</td></tr>
    <tr><th>합산 산출세액</th><td>${fmt(combinedTax)}원</td></tr>
    <tr><th>기납부세액공제(근사)</th><td>-${fmt(priorTax)}원</td></tr>
    <tr><th>세대생략 할증</th><td>${genskip ? `적용 (${surtaxRate === 1.4 ? '40%, 미성년+20억 초과' : '30%'})` : '해당 없음'}</td></tr>
    <tr><th>할증 후 산출세액</th><td>${fmt(afterSurtax)}원</td></tr>
    <tr><th>신고세액공제(3%)</th><td>-${fmt(reportCredit)}원</td></tr>
    <tr class="stat-highlight"><th>납부할 세액(추정)</th><td>${fmt(finalTax)}원</td></tr>
  `;

  document.getElementById('nextInheritance').href = 'inheritance-tax-calculator';

  UrlState.sync({ amount, relation, marriage: marriage ? 'yes' : 'no', genskip: genskip ? 'yes' : 'no', prior }, URL_DEFAULTS);
}

document.getElementById('gt-amount').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('gt-prior').addEventListener('input', function(){ formatInputComma(this); recalc(); });

const URL_DEFAULTS = { amount: '300000000', relation: 'ascendant_adult', marriage: 'no', genskip: 'no', prior: '0' };

const urlParams = UrlState.read();
document.getElementById('gt-amount').value = Number(urlParams.amount || URL_DEFAULTS.amount).toLocaleString('ko-KR');
document.getElementById('gt-prior').value = Number(urlParams.prior || URL_DEFAULTS.prior).toLocaleString('ko-KR');
if (urlParams.relation) document.getElementById('gt-relation').value = urlParams.relation;
updateConditionalFields();
if (urlParams.marriage) clickToggle('marriage', urlParams.marriage);
if (urlParams.genskip) clickToggle('genskip', urlParams.genskip);

recalc();
