let compareChart = null;
let scheduleCache = {};
let visibleRows = 12;
let activeType = 'equal-principal-interest';
let debounceTimer = null;
let periodType = 'year';
let graceType = 'month';
let extraType = 'shorten';

const METHODS = [
  { key:'equal-principal-interest', label:'원리금균등상환', tag:'매달 동일' },
  { key:'equal-principal',          label:'원금균등상환',   tag:'원금 우선' },
  { key:'bullet',                   label:'원금만기일시상환', tag:'만기 일시' }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.getElementById('p-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('p-amount').value = (300000000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('p-amount', Number(btn.dataset.add));
    scheduleRecalc();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('p-amount');
  scheduleRecalc();
});

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'periodType') periodType = btn.dataset.value;
      if (group.dataset.target === 'graceType') graceType = btn.dataset.value;
      if (group.dataset.target === 'extraType') extraType = btn.dataset.value;
      scheduleRecalc();
    });
  });
});

['p-period','p-rate','p-grace','p-extra-month'].forEach(id=>{
  document.getElementById(id).addEventListener('input', scheduleRecalc);
});
document.getElementById('p-extra-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });

function scheduleRecalc(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalcAll, 150);
}

function computeSchedule(P, totalMonths, monthlyRate, graceMonths, type, extra){
  let balance = P;
  let totalInterest = 0;
  const repayMonths = totalMonths - graceMonths;
  const schedule = [];

  let monthlyConstant = 0;
  if (type === 'equal-principal-interest' && repayMonths > 0) {
    monthlyConstant = (P * monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) / (Math.pow(1 + monthlyRate, repayMonths) - 1);
  }
  let fixedPrincipal = (type === 'equal-principal' && repayMonths > 0) ? P / repayMonths : 0;

  const hasExtra = !!(extra && extra.month > 0 && extra.month < totalMonths && extra.amount > 0);
  let extraDone = false;

  for (let m = 1; m <= totalMonths; m++){
    if (balance <= 0) break;

    let interestPayment = balance * monthlyRate;
    let principalPayment = 0;

    if (m <= graceMonths){
      principalPayment = 0;
    } else if (type === 'equal-principal-interest'){
      principalPayment = monthlyConstant - interestPayment;
    } else if (type === 'equal-principal'){
      principalPayment = fixedPrincipal;
    } else if (type === 'bullet'){
      principalPayment = (m === totalMonths) ? balance : 0;
    }

    if (principalPayment > balance) principalPayment = balance;
    balance -= principalPayment;
    if (balance < 0) balance = 0;

    let extraPayment = 0;
    if (hasExtra && !extraDone && m === extra.month && balance > 0){
      extraPayment = Math.min(extra.amount, balance);
      balance -= extraPayment;
      extraDone = true;

      const remainingMonths = totalMonths - m;
      if (balance > 0 && remainingMonths > 0 && extra.type === 'reduce'){
        if (type === 'equal-principal-interest'){
          monthlyConstant = (balance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        } else if (type === 'equal-principal'){
          fixedPrincipal = balance / remainingMonths;
        }
      }
    }

    totalInterest += interestPayment;
    const totalPrincipal = principalPayment + extraPayment;

    schedule.push({
      month:m, principal:Math.round(totalPrincipal), interest:Math.round(interestPayment),
      total:Math.round(totalPrincipal + interestPayment), balance:Math.round(balance),
      hasExtra: extraPayment > 0
    });
  }
  return { schedule, totalInterest };
}

function recalcAll(){
  const P = parseFloat(document.getElementById('p-amount').value.replace(/,/g,''));
  const periodVal = parseFloat(document.getElementById('p-period').value);
  const totalMonths = periodType === 'year' ? periodVal * 12 : periodVal;

  const rate = parseFloat(document.getElementById('p-rate').value) / 100;
  const monthlyRate = rate / 12;

  const graceVal = parseFloat(document.getElementById('p-grace').value) || 0;
  const graceMonths = graceType === 'year' ? graceVal * 12 : graceVal;

  const extraMonth = parseInt(document.getElementById('p-extra-month').value) || 0;
  const extraAmount = parseFloat(document.getElementById('p-extra-amount').value.replace(/,/g,'')) || 0;
  const extra = { month: extraMonth, amount: extraAmount, type: extraType };
  const hasExtra = extraMonth > 0 && extraMonth < totalMonths && extraAmount > 0;

  const grid = document.getElementById('compareGrid');
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');

  if (!P || !totalMonths || isNaN(rate) || graceMonths >= totalMonths){
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">금액·기간·이자율을 확인해 주세요 (거치기간은 총 기간보다 짧아야 합니다)</div>';
    meta.textContent = '--';
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    if (compareChart) { compareChart.destroy(); compareChart = null; }
    document.getElementById('ledgerBody').innerHTML = '';
    document.getElementById('ledgerTabs').innerHTML = '';
    return;
  }

  meta.textContent = `원금 ${fmt(P)}원 · ${totalMonths}개월 · 연 ${document.getElementById('p-rate').value}%`
    + (hasExtra ? ` · 중도상환 ${extraMonth}회차 ${fmt(extraAmount)}원` : '');

  scheduleCache = {};
  METHODS.forEach(m=>{
    scheduleCache[m.key] = computeSchedule(P, totalMonths, monthlyRate, graceMonths, m.key, extra);
  });

  const bestKey = METHODS.reduce((best, m)=>
    scheduleCache[m.key].totalInterest < scheduleCache[best].totalInterest ? m.key : best
  , METHODS[0].key);
  const bestLabel = METHODS.find(m=>m.key===bestKey).label;

  miniScreen.textContent = fmt(scheduleCache[bestKey].totalInterest) + '원';
  miniScreenSub.textContent = `${bestLabel} 기준`;

  grid.innerHTML = METHODS.map(m=>{
    const data = scheduleCache[m.key];
    const firstPayment = data.schedule[0].total;
    const totalRepay = P + data.totalInterest;
    const isBest = m.key === bestKey;
    return `
      <div class="method-card">
        ${isBest ? '<div class="stamp">이자<br>최적</div>' : ''}
        <h3>${m.label}</h3>
        <div class="sub">${m.tag}</div>
        <div class="method-row"><span>첫 달 상환금</span><span class="val">${fmt(firstPayment)}원</span></div>
        <div class="method-row total"><span>총 납입 이자</span><span class="val">${fmt(data.totalInterest)}원</span></div>
        <div class="method-row"><span>총 상환 금액</span><span class="val">${fmt(totalRepay)}원</span></div>
      </div>
    `;
  }).join('');

  renderChart();
  renderTabs(bestKey);
  visibleRows = 12;
  if (!scheduleCache[activeType]) activeType = bestKey;
  renderLedger();

  UrlState.sync({
    amount: P, period: periodVal, periodUnit: periodType, rate: document.getElementById('p-rate').value,
    grace: graceVal, graceUnit: graceType,
    extraMonth: extraMonth || '', extraAmount: extraAmount || '', extraType
  }, URL_DEFAULTS);
}

function renderChart(){
  const ctx = document.getElementById('compareChart').getContext('2d');
  if (compareChart) compareChart.destroy();
  compareChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: METHODS.map(m=>m.label),
      datasets:[{
        data: METHODS.map(m=>scheduleCache[m.key].totalInterest),
        backgroundColor: ['#373b40', '#9ca0a6', '#c23662'],
        borderRadius:3,
        maxBarThickness:44
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        y:{ ticks:{ callback:(v)=>fmt(v)+'원', font:{size:10} }, grid:{ color:'#eee' } },
        x:{ ticks:{ font:{size:11} }, grid:{ display:false } }
      }
    }
  });
}

function renderTabs(bestKey){
  const wrap = document.getElementById('ledgerTabs');
  wrap.innerHTML = METHODS.map(m=>`
    <button class="ledger-tab ${m.key === activeType ? 'active' : ''}" data-key="${m.key}">
      ${m.label}${m.key === bestKey ? ' ✓' : ''}
    </button>
  `).join('');
  wrap.querySelectorAll('.ledger-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeType = btn.dataset.key;
      visibleRows = 12;
      renderTabs(bestKey);
      renderLedger();
    });
  });
}

function renderLedger(){
  const data = scheduleCache[activeType];
  if (!data) return;
  const body = document.getElementById('ledgerBody');
  const rows = data.schedule.slice(0, visibleRows);
  body.innerHTML = rows.map(r=>`
    <tr class="${r.hasExtra ? 'extra-row' : ''}">
      <td>${r.month}회차</td>
      <td>${fmt(r.principal)}원</td>
      <td>${fmt(r.interest)}원</td>
      <td>${fmt(r.total)}원</td>
      <td>${fmt(r.balance)}원</td>
    </tr>
  `).join('');
  document.getElementById('loadMoreBtn').style.display = (visibleRows < data.schedule.length) ? 'inline-block' : 'none';
}

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  visibleRows += 12;
  renderLedger();
});

const URL_DEFAULTS = {
  amount: '300000000',
  period: document.getElementById('p-period').defaultValue,
  periodUnit: toggleDefault('periodType'),
  rate: document.getElementById('p-rate').defaultValue,
  grace: document.getElementById('p-grace').defaultValue,
  graceUnit: toggleDefault('graceType'),
  extraMonth: '', extraAmount: '',
  extraType: toggleDefault('extraType')
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('p-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.period) document.getElementById('p-period').value = urlParams.period;
if (urlParams.rate) document.getElementById('p-rate').value = urlParams.rate;
if (urlParams.grace) document.getElementById('p-grace').value = urlParams.grace;
if (urlParams.extraMonth) document.getElementById('p-extra-month').value = urlParams.extraMonth;
if (urlParams.extraAmount) document.getElementById('p-extra-amount').value = Number(urlParams.extraAmount).toLocaleString('ko-KR');
if (urlParams.periodUnit) clickToggle('periodType', urlParams.periodUnit);
if (urlParams.graceUnit) clickToggle('graceType', urlParams.graceUnit);
if (urlParams.extraType) clickToggle('extraType', urlParams.extraType);

recalcAll();
