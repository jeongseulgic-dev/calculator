let mode = 'butim';
let bRegion = 'capital';
let bHousehold = 'general';
let kRegion = 'capital';
let kHousehold = 'general';
let bRateTouched = false;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

const UNIT_CAP = {
  general:  { capital: 120000000, other: 80000000 },
  newlywed: { capital: 250000000, other: 160000000 }
};

const RATE_TABLE = [
  [2.5, 2.6, 2.7],
  [2.7, 2.8, 2.9],
  [3.0, 3.1, 3.2],
  [3.3, 3.4, 3.5]
];

const INCOME_CAP = { general: 50000000, newlywed: 75000000 };

const BANK_CAP_LIMIT = {
  general: { capital: 400000000, other: 320000000 },
  special: { capital: 450000000, other: 360000000 }
};

function incomeRowIndex(income){
  if (income <= 20000000) return 0;
  if (income <= 40000000) return 1;
  if (income <= 60000000) return 2;
  return 3;
}

function depositColIndex(deposit){
  if (deposit <= 50000000) return 0;
  if (deposit <= 100000000) return 1;
  return 2;
}

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount(btn.dataset.target, Number(btn.dataset.add));
    recalc();
  });
});
document.querySelectorAll('.calc-key[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    resetAmount(btn.dataset.target);
    recalc();
  });
});

document.getElementById('b-deposit').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('b-income').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('b-rate').addEventListener('input', function(){ bRateTouched = true; recalc(); });
document.getElementById('k-deposit').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('k-rate').addEventListener('input', recalc);

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = group.dataset.target;
      if (target === 'mode'){
        mode = btn.dataset.value;
        document.querySelectorAll('.mode-field').forEach(f=>{
          f.classList.toggle('hidden', f.dataset.mode !== mode);
        });
      } else if (target === 'bRegion') bRegion = btn.dataset.value;
      else if (target === 'bHousehold') bHousehold = btn.dataset.value;
      else if (target === 'kRegion') kRegion = btn.dataset.value;
      else if (target === 'kHousehold') kHousehold = btn.dataset.value;
      recalc();
    });
  });
});

function recalc(){
  if (mode === 'butim') recalcButim();
  else recalcBank();
}

function recalcButim(){
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const miniScreenLabel = document.getElementById('miniScreenLabel');
  const statBody = document.getElementById('statBody');

  miniScreenLabel.textContent = '월 이자';

  const deposit = parseFloat(document.getElementById('b-deposit').value.replace(/,/g,''));
  const income = parseFloat(document.getElementById('b-income').value.replace(/,/g,''));

  if (!deposit || deposit <= 0 || !income || income <= 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">임차보증금과 연소득을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const regionLabel = bRegion === 'capital' ? '수도권' : '수도권 외(지방)';
  const householdLabel = bHousehold === 'newlywed' ? '신혼·다자녀가구' : '일반가구';

  const ratio = bHousehold === 'newlywed' ? 80 : 70;
  const demandCap = deposit * ratio / 100;
  const unitCap = UNIT_CAP[bHousehold][bRegion];
  const finalCap = Math.min(demandCap, unitCap);
  const capBasis = demandCap <= unitCap ? '보증금 비율 기준' : '호당대출한도 기준';

  let matrixRate = RATE_TABLE[incomeRowIndex(income)][depositColIndex(deposit)];
  if (bRegion === 'other') matrixRate -= 0.2;
  if (!bRateTouched) document.getElementById('b-rate').value = matrixRate.toFixed(1);
  const rate = parseFloat(document.getElementById('b-rate').value) || 0;

  meta.textContent = `보증금 ${fmt(deposit)}원 · ${regionLabel} · ${householdLabel} · 연 ${rate}%`;

  const monthlyInterest = finalCap * rate / 100 / 12;

  miniScreen.textContent = fmt(monthlyInterest) + '원';
  miniScreenSub.textContent = `한도 ${fmt(finalCap)}원 · 연 ${rate.toFixed(1)}%`;

  const incomeCap = INCOME_CAP[bHousehold === 'newlywed' ? 'newlywed' : 'general'];
  const overIncome = income > incomeCap;

  statBody.innerHTML = `
    <tr><th>대출 한도</th><td>${fmt(finalCap)}원</td></tr>
    <tr><th>적용 기준</th><td>${capBasis} (호당한도 ${fmt(unitCap)}원)</td></tr>
    <tr><th>적용 금리</th><td>연 ${rate.toFixed(1)}%</td></tr>
    <tr class="stat-highlight"><th>월 이자</th><td>${fmt(monthlyInterest)}원</td></tr>
    ${overIncome ? `<tr><td colspan="2" style="color:var(--pink); font-weight:700;">부부합산 연소득이 기준(${fmt(incomeCap)}원)을 초과해 버팀목전세자금대출 대상이 아닐 수 있습니다.</td></tr>` : ''}
  `;

  UrlState.sync({
    mode, bDeposit: deposit, bRegion, bHousehold, bIncome: income,
    bRate: bRateTouched ? document.getElementById('b-rate').value : ''
  }, URL_DEFAULTS);
}

function recalcBank(){
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const miniScreenLabel = document.getElementById('miniScreenLabel');
  const statBody = document.getElementById('statBody');

  miniScreenLabel.textContent = '월 이자';

  const deposit = parseFloat(document.getElementById('k-deposit').value.replace(/,/g,''));
  const rate = parseFloat(document.getElementById('k-rate').value);

  if (!deposit || deposit <= 0 || isNaN(rate)){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">임차보증금과 금리를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const regionLabel = kRegion === 'capital' ? '수도권·규제지역' : '그 외 지역';
  const householdLabel = kHousehold === 'special' ? '신혼부부·청년가구' : '일반가구';
  meta.textContent = `보증금 ${fmt(deposit)}원 · ${regionLabel} · ${householdLabel} · 연 ${rate}%`;

  const guaranteeRatio = (kRegion === 'capital' && kHousehold === 'general') ? 80 : 90;
  const capLimit = BANK_CAP_LIMIT[kHousehold][kRegion];
  const ratioAmount = deposit * guaranteeRatio / 100;
  const loanAmount = Math.min(ratioAmount, capLimit);
  const basis = ratioAmount <= capLimit ? '보증비율 기준' : '한도 상한액 기준';

  const monthlyInterest = loanAmount * rate / 100 / 12;

  miniScreen.textContent = fmt(monthlyInterest) + '원';
  miniScreenSub.textContent = `대출액 ${fmt(loanAmount)}원 · 연 ${rate}%`;

  statBody.innerHTML = `
    <tr><th>보증비율</th><td>${guaranteeRatio}%</td></tr>
    <tr><th>대출 가능액</th><td>${fmt(loanAmount)}원</td></tr>
    <tr><th>적용 기준</th><td>${basis} (한도 상한액 ${fmt(capLimit)}원)</td></tr>
    <tr class="stat-highlight"><th>월 이자</th><td>${fmt(monthlyInterest)}원</td></tr>
  `;

  UrlState.sync({
    mode, kDeposit: deposit, kRegion, kHousehold, kRate: document.getElementById('k-rate').value
  }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  bDeposit: '200000000',
  bRegion: toggleDefault('bRegion'),
  bHousehold: toggleDefault('bHousehold'),
  bIncome: '45000000',
  kDeposit: '300000000',
  kRegion: toggleDefault('kRegion'),
  kHousehold: toggleDefault('kHousehold'),
  kRate: document.getElementById('k-rate').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.bDeposit) document.getElementById('b-deposit').value = Number(urlParams.bDeposit).toLocaleString('ko-KR');
if (urlParams.bIncome) document.getElementById('b-income').value = Number(urlParams.bIncome).toLocaleString('ko-KR');
if (urlParams.bRate){ document.getElementById('b-rate').value = urlParams.bRate; bRateTouched = true; }
if (urlParams.kDeposit) document.getElementById('k-deposit').value = Number(urlParams.kDeposit).toLocaleString('ko-KR');
if (urlParams.kRate) document.getElementById('k-rate').value = urlParams.kRate;
if (urlParams.bRegion) clickToggle('bRegion', urlParams.bRegion);
if (urlParams.bHousehold) clickToggle('bHousehold', urlParams.bHousehold);
if (urlParams.kRegion) clickToggle('kRegion', urlParams.kRegion);
if (urlParams.kHousehold) clickToggle('kHousehold', urlParams.kHousehold);
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
