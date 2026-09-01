const debtRowsEl = document.getElementById('debtRows');
let capType = 40;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
function fmt2(n){ return n.toLocaleString('ko-KR', { minimumFractionDigits:2, maximumFractionDigits:2 }); }

function maxPrincipalEqualPI(monthlyPayment, monthlyRate, months){
  if (monthlyPayment <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return monthlyPayment * months;
  return monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, months));
}

function maxPrincipalEqualPrincipal(monthlyPayment, monthlyRate, months){
  if (monthlyPayment <= 0 || months <= 0) return 0;
  return monthlyPayment / (1 / months + monthlyRate);
}

function createDebtRow(type, principal, interest){
  const row = document.createElement('div');
  row.className = 'debt-row';
  row.innerHTML = `
    <select class="debt-type">
      <option value="mortgage"${type === 'mortgage' ? ' selected' : ''}>주택담보대출</option>
      <option value="other"${type === 'other' ? ' selected' : ''}>기타대출</option>
    </select>
    <input type="text" class="debt-principal" placeholder="연간 원금상환액" value="${principal != null ? Number(principal).toLocaleString('ko-KR') : ''}">
    <input type="text" class="debt-interest" placeholder="연간 이자상환액" value="${interest != null ? Number(interest).toLocaleString('ko-KR') : ''}">
    <button type="button" class="debt-row-remove" aria-label="부채 삭제">×</button>
  `;
  row.querySelector('.debt-type').addEventListener('change', recalc);
  row.querySelector('.debt-principal').addEventListener('input', function(){ formatInputComma(this); recalc(); });
  row.querySelector('.debt-interest').addEventListener('input', function(){ formatInputComma(this); recalc(); });
  row.querySelector('.debt-row-remove').addEventListener('click', () => {
    row.remove();
    updateRemoveButtons();
    recalc();
  });
  return row;
}

function updateRemoveButtons(){
  const rows = debtRowsEl.querySelectorAll('.debt-row');
  rows.forEach(row => {
    row.querySelector('.debt-row-remove').disabled = rows.length <= 1;
  });
}

function addDebtRow(type, principal, interest){
  debtRowsEl.appendChild(createDebtRow(type, principal, interest));
  updateRemoveButtons();
}

document.getElementById('addDebtBtn').addEventListener('click', () => {
  addDebtRow('other', null, null);
  recalc();
});

document.getElementById('d-income').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('d-income', Number(btn.dataset.add));
    recalc();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('d-income');
  recalc();
});

document.querySelectorAll('.seg-toggle[data-target="capType"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="capType"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    capType = parseInt(btn.dataset.value);
    recalc();
  });
});
['d-new-rate', 'd-new-period'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

function serializeDebts(){
  return Array.from(debtRowsEl.querySelectorAll('.debt-row')).map(row => {
    const type = row.querySelector('.debt-type').value;
    const principal = row.querySelector('.debt-principal').value.replace(/,/g,'') || '0';
    const interest = row.querySelector('.debt-interest').value.replace(/,/g,'') || '0';
    return `${type}:${principal}:${interest}`;
  }).join(',');
}

function recalc(){
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const limitBody = document.getElementById('limitBody');

  const income = parseFloat(document.getElementById('d-income').value.replace(/,/g,''));

  if (!income || income <= 0){
    miniScreen.textContent = '0%';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">연소득과 부채를 입력해 주세요</td></tr>';
    limitBody.innerHTML = '';
    meta.textContent = '--';
    return;
  }

  const rows = Array.from(debtRowsEl.querySelectorAll('.debt-row'));
  let totalPI = 0, dtiPI = 0, count = 0;
  rows.forEach(row => {
    const type = row.querySelector('.debt-type').value;
    const principal = parseFloat(row.querySelector('.debt-principal').value.replace(/,/g,'')) || 0;
    const interest = parseFloat(row.querySelector('.debt-interest').value.replace(/,/g,'')) || 0;
    if (principal <= 0 && interest <= 0) return;
    totalPI += principal + interest;
    dtiPI += (type === 'mortgage') ? (principal + interest) : interest;
    count++;
  });

  const dsr = totalPI / income * 100;
  const dti = dtiPI / income * 100;

  miniScreen.textContent = fmt2(dsr) + '%';
  miniScreenSub.textContent = `DTI ${fmt2(dti)}%`;
  meta.textContent = `연소득 ${fmt(income)}원 · 부채 ${count}건`;

  function statusText(rate){
    if (rate <= 40) return '은행권(40%)·2금융권(50%) 규제 이내';
    if (rate <= 50) return '은행권(40%) 초과 · 2금융권(50%) 이내';
    return '은행권·2금융권 규제 비율 모두 초과';
  }

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>DSR</th><td>${fmt2(dsr)}%</td></tr>
    <tr><th>DSR 기준 판정</th><td>${statusText(dsr)}</td></tr>
    <tr class="stat-highlight"><th>DTI</th><td>${fmt2(dti)}%</td></tr>
    <tr><th>DTI 기준 판정</th><td>${statusText(dti)}</td></tr>
  `;

  const newRate = parseFloat(document.getElementById('d-new-rate').value);
  const newPeriod = parseFloat(document.getElementById('d-new-period').value);
  const monthlyRate = (newRate || 0) / 100 / 12;
  const months = (newPeriod || 0) * 12;

  const availablePI_dsr = Math.max(0, capType / 100 * income - totalPI);
  const availablePI_dti = Math.max(0, capType / 100 * income - dtiPI);
  const availableMonthly = Math.min(availablePI_dsr, availablePI_dti) / 12;
  const limitedBy = availablePI_dsr <= availablePI_dti ? 'DSR' : 'DTI';

  if (availableMonthly <= 0 || months <= 0){
    limitBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">이미 선택한 규제 비율을 초과해 추가로 빌릴 수 있는 한도가 없습니다</td></tr>';
  } else {
    const maxEqualPI = maxPrincipalEqualPI(availableMonthly, monthlyRate, months);
    const maxEqualPrincipal = maxPrincipalEqualPrincipal(availableMonthly, monthlyRate, months);
    limitBody.innerHTML = `
      <tr><th>여유 월 상환액</th><td>${fmt(availableMonthly)}원</td></tr>
      <tr><th>기준</th><td>${limitedBy} 여유분 (더 낮은 쪽)</td></tr>
      <tr class="stat-highlight"><th>원리금균등 기준 최대 원금</th><td>${fmt(maxEqualPI)}원</td></tr>
      <tr class="stat-highlight"><th>원금균등 기준 최대 원금</th><td>${fmt(maxEqualPrincipal)}원</td></tr>
    `;
  }

  UrlState.sync({ income, debts: serializeDebts(), capType, newRate: document.getElementById('d-new-rate').value, newPeriod: document.getElementById('d-new-period').value }, URL_DEFAULTS);
}

const DEFAULT_DEBTS = 'mortgage:6000000:5000000,other:2000000:1000000';

const URL_DEFAULTS = {
  income: '50000000',
  debts: DEFAULT_DEBTS,
  capType: toggleDefault('capType'),
  newRate: document.getElementById('d-new-rate').defaultValue,
  newPeriod: document.getElementById('d-new-period').defaultValue
};

addDebtRow('mortgage', 6000000, 5000000);
addDebtRow('other', 2000000, 1000000);
document.getElementById('d-income').value = (50000000).toLocaleString('ko-KR');

const urlParams = UrlState.read();
if (urlParams.income) document.getElementById('d-income').value = Number(urlParams.income).toLocaleString('ko-KR');
if (urlParams.debts){
  const parsed = urlParams.debts.split(',').map(s => s.split(':')).filter(p => p.length === 3);
  if (parsed.length){
    debtRowsEl.innerHTML = '';
    parsed.forEach(([type, principal, interest]) => addDebtRow(type, principal, interest));
  }
}
if (urlParams.newRate) document.getElementById('d-new-rate').value = urlParams.newRate;
if (urlParams.newPeriod) document.getElementById('d-new-period').value = urlParams.newPeriod;
if (urlParams.capType) clickToggle('capType', urlParams.capType);

recalc();
