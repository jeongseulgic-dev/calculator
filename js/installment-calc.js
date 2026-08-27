let compareChart = null;
let scheduleCache = {};
let visibleRows = 12;
let activeType = 'opt1';
let debounceTimer = null;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.getElementById('c-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('c-amount').value = (1000000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('c-amount', Number(btn.dataset.add));
    scheduleRecalc();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('c-amount');
  scheduleRecalc();
});

['c-rate','c-m1','c-m2','c-m3'].forEach(id=>{
  document.getElementById(id).addEventListener('input', scheduleRecalc);
});

function scheduleRecalc(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalcAll, 150);
}

function computeSchedule(P, N, monthlyRate){
  let balance = P;
  let totalFee = 0;
  const schedule = [];
  const monthlyConstant = monthlyRate === 0 ? P / N
    : (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1);

  for (let m = 1; m <= N; m++){
    if (balance <= 0) break;
    let feePayment = balance * monthlyRate;
    let principalPayment = monthlyConstant - feePayment;
    if (principalPayment > balance) principalPayment = balance;
    balance -= principalPayment;
    if (balance < 0) balance = 0;
    totalFee += feePayment;
    schedule.push({
      month: m, principal: Math.round(principalPayment), interest: Math.round(feePayment),
      total: Math.round(principalPayment + feePayment), balance: Math.round(balance)
    });
  }
  return { schedule, totalFee };
}

function getOptions(){
  const m1 = parseInt(document.getElementById('c-m1').value) || 0;
  const m2 = parseInt(document.getElementById('c-m2').value) || 0;
  const m3 = parseInt(document.getElementById('c-m3').value) || 0;
  return [
    { key: 'opt1', months: m1 },
    { key: 'opt2', months: m2 },
    { key: 'opt3', months: m3 }
  ];
}

function recalcAll(){
  const P = Number(document.getElementById('c-amount').value.replace(/,/g, ''));
  const rateVal = document.getElementById('c-rate').value;
  const rate = parseFloat(rateVal) / 100;
  const monthlyRate = rate / 12;
  const OPTIONS = getOptions();
  const validOptions = OPTIONS.filter(o=>o.months > 0);

  const grid = document.getElementById('compareGrid');
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');

  if (!P || isNaN(rate) || validOptions.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">구매금액·수수료율·할부개월수를 확인해 주세요</div>';
    meta.textContent = '--';
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    if (compareChart) { compareChart.destroy(); compareChart = null; }
    document.getElementById('ledgerBody').innerHTML = '';
    document.getElementById('ledgerTabs').innerHTML = '';
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('csvDownloadBtn').style.display = 'none';
    return;
  }

  meta.textContent = `구매금액 ${fmt(P)}원 · 수수료율 연 ${rateVal}% · 비교 ${validOptions.map(o=>o.months).join('/')}개월`;

  scheduleCache = {};
  validOptions.forEach(o=>{
    scheduleCache[o.key] = computeSchedule(P, o.months, monthlyRate);
  });

  const bestKey = validOptions.reduce((best, o)=>
    scheduleCache[o.key].totalFee < scheduleCache[best].totalFee ? o.key : best
  , validOptions[0].key);
  const bestOpt = validOptions.find(o=>o.key === bestKey);

  miniScreen.textContent = fmt(scheduleCache[bestKey].totalFee) + '원';
  miniScreenSub.textContent = `${bestOpt.months}개월 기준 최저 수수료`;

  grid.innerHTML = validOptions.map(o=>{
    const data = scheduleCache[o.key];
    const firstPayment = data.schedule[0].total;
    const totalRepay = P + data.totalFee;
    const isBest = o.key === bestKey;
    return `
      <div class="method-card">
        ${isBest ? '<div class="stamp">수수료<br>최저</div>' : ''}
        <h3>${o.months}개월</h3>
        <div class="sub">월 ${o.months}회 납부</div>
        <div class="method-row"><span>월 상환액</span><span class="val">${fmt(firstPayment)}원</span></div>
        <div class="method-row total"><span>총 수수료</span><span class="val">${fmt(data.totalFee)}원</span></div>
        <div class="method-row"><span>총 상환금액</span><span class="val">${fmt(totalRepay)}원</span></div>
      </div>
    `;
  }).join('');

  renderChart(validOptions);
  renderTabs(validOptions, bestKey);
  visibleRows = 12;
  if (!scheduleCache[activeType]) activeType = bestKey;
  renderLedger();

  UrlState.sync({
    amount: P, rate: rateVal, m1: OPTIONS[0].months, m2: OPTIONS[1].months, m3: OPTIONS[2].months
  }, URL_DEFAULTS);
}

function renderChart(options){
  const ctx = document.getElementById('compareChart').getContext('2d');
  if (compareChart) compareChart.destroy();
  compareChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: options.map(o=>`${o.months}개월`),
      datasets: [{
        data: options.map(o=>scheduleCache[o.key].totalFee),
        backgroundColor: ['#373b40', '#9ca0a6', '#c23662'],
        borderRadius: 3,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v)=>fmt(v) + '원', font: { size: 10 } }, grid: { color: '#eee' } },
        x: { ticks: { font: { size: 11 } }, grid: { display: false } }
      }
    }
  });
}

function renderTabs(options, bestKey){
  const wrap = document.getElementById('ledgerTabs');
  wrap.innerHTML = options.map(o=>`
    <button class="ledger-tab ${o.key === activeType ? 'active' : ''}" data-key="${o.key}">
      ${o.months}개월${o.key === bestKey ? ' ✓' : ''}
    </button>
  `).join('');
  wrap.querySelectorAll('.ledger-tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      activeType = btn.dataset.key;
      visibleRows = 12;
      renderTabs(options, bestKey);
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
    <tr>
      <td>${r.month}회차</td>
      <td>${fmt(r.principal)}원</td>
      <td>${fmt(r.interest)}원</td>
      <td>${fmt(r.total)}원</td>
      <td>${fmt(r.balance)}원</td>
    </tr>
  `).join('');
  document.getElementById('loadMoreBtn').style.display = (visibleRows < data.schedule.length) ? 'inline-block' : 'none';
  document.getElementById('csvDownloadBtn').style.display = 'inline-block';
}

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  visibleRows += 12;
  renderLedger();
});

document.getElementById('csvDownloadBtn').addEventListener('click', ()=>{
  const data = scheduleCache[activeType];
  if (!data) return;
  const months = data.schedule.length;
  const rateVal = document.getElementById('c-rate').value;
  const amount = document.getElementById('c-amount').value;
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  Export.downloadCsv(
    `할부수수료계산_${months}개월_${dateStr}.csv`,
    ['회차','할부원금','수수료','월 상환액','잔액'],
    data.schedule.map(r=>[r.month, r.principal, r.interest, r.total, r.balance]),
    '본 계산 결과는 참고용이며, 실제 할부 수수료는 카드사·상품·이벤트 조건에 따라 달라질 수 있습니다.',
    [
      ['구매금액(원)','연 수수료율(%)','할부개월수'],
      [amount, rateVal, months]
    ]
  );
});

const URL_DEFAULTS = {
  amount: '1000000',
  rate: document.getElementById('c-rate').defaultValue,
  m1: document.getElementById('c-m1').defaultValue,
  m2: document.getElementById('c-m2').defaultValue,
  m3: document.getElementById('c-m3').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('c-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.rate) document.getElementById('c-rate').value = urlParams.rate;
if (urlParams.m1) document.getElementById('c-m1').value = urlParams.m1;
if (urlParams.m2) document.getElementById('c-m2').value = urlParams.m2;
if (urlParams.m3) document.getElementById('c-m3').value = urlParams.m3;

recalcAll();
