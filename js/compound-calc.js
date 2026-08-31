let compoundChart = null;
let schedule = [];
let visibleRows = 12;
let period = 'month';
let debounceTimer = null;
let principal = 0;

const PERIOD_LABEL = { day: '일', week: '주', month: '개월', year: '년' };

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
function fmt2(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 }); }

function updateDynamicLabels(){
  const unit = PERIOD_LABEL[period];
  document.querySelector('label[for="ci-rate"]').textContent = `주기당 수익률 (%, ${unit}당)`;
  document.querySelector('label[for="ci-periods"]').textContent = `총 투자 기간 (${unit} 수)`;
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) loadMoreBtn.textContent = `+12${unit} 더보기`;
}

document.getElementById('ci-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('ci-amount').value = (10000000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('ci-amount', Number(btn.dataset.add));
    scheduleRecalc();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('ci-amount');
  scheduleRecalc();
});

document.querySelectorAll('.seg-toggle[data-target="period"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="period"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    period = btn.dataset.value;
    updateDynamicLabels();
    scheduleRecalc();
  });
});

['ci-rate','ci-periods'].forEach(id=>{
  document.getElementById(id).addEventListener('input', scheduleRecalc);
});

function scheduleRecalc(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalcAll, 150);
}

function computeSchedule(P, rate, N){
  let balance = P;
  const rows = [];
  for (let n = 1; n <= N; n++){
    const interest = balance * rate;
    balance += interest;
    rows.push({ period: n, interest: Math.round(interest), balance: Math.round(balance) });
  }
  const simpleTotal = P * (1 + rate * N);
  return { rows, finalBalance: balance, simpleTotal };
}

function recalcAll(){
  const P = Number(document.getElementById('ci-amount').value.replace(/,/g, ''));
  const rateVal = document.getElementById('ci-rate').value;
  const rate = parseFloat(rateVal) / 100;
  const N = parseInt(document.getElementById('ci-periods').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!P || isNaN(rate) || !N || N < 1){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">원금·수익률·투자 기간을 확인해 주세요</td></tr>';
    meta.textContent = '--';
    if (compoundChart) { compoundChart.destroy(); compoundChart = null; }
    document.getElementById('ledgerBody').innerHTML = '';
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('csvDownloadBtn').style.display = 'none';
    return;
  }

  const result = computeSchedule(P, rate, N);
  schedule = result.rows;
  principal = P;
  const totalInterest = result.finalBalance - P;
  const simpleInterest = result.simpleTotal - P;
  const compoundEffect = result.finalBalance - result.simpleTotal;
  const yieldPct = (totalInterest / P) * 100;

  miniScreen.textContent = fmt(result.finalBalance) + '원';
  miniScreenSub.textContent = `총 수익 +${fmt(totalInterest)}원 (${fmt2(yieldPct)}%)`;

  statBody.innerHTML = `
    <tr><th>원금</th><td>${fmt(P)}원</td></tr>
    <tr class="stat-highlight"><th>복리 최종 금액</th><td>${fmt(result.finalBalance)}원</td></tr>
    <tr><th>총 수익 (복리)</th><td>+${fmt(totalInterest)}원</td></tr>
    <tr><th>총 수익률 (복리)</th><td>+${fmt2(yieldPct)}%</td></tr>
    <tr><th>단리였다면</th><td>${fmt(result.simpleTotal)}원 (+${fmt(simpleInterest)}원)</td></tr>
    <tr><th>복리 효과</th><td>+${fmt(compoundEffect)}원</td></tr>
  `;

  renderChart();
  visibleRows = 12;
  renderLedger();
  updateDynamicLabels();

  meta.textContent = `원금 ${fmt(P)}원 · ${PERIOD_LABEL[period]}복리 ${rateVal}% · ${N}${PERIOD_LABEL[period]}`;

  UrlState.sync({
    amount: P, period, rate: rateVal, periods: N
  }, URL_DEFAULTS);
}

function renderChart(){
  const ctx = document.getElementById('compoundChart').getContext('2d');
  if (compoundChart) compoundChart.destroy();
  compoundChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: schedule.map(r=>r.period),
      datasets: [{
        data: schedule.map(r=>r.balance),
        borderColor: '#c23662',
        backgroundColor: 'rgba(194,54,98,0.1)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.15
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: (v)=>fmt(v) + '원', font: { size: 10 } }, grid: { color: '#eee' } },
        x: { ticks: { font: { size: 10 }, maxTicksLimit: 8 }, grid: { display: false } }
      }
    }
  });
}

function renderLedger(){
  const body = document.getElementById('ledgerBody');
  const rows = schedule.slice(0, visibleRows);
  body.innerHTML = rows.map(r=>{
    const pct = principal ? (r.balance - principal) / principal * 100 : 0;
    return `
    <tr>
      <td>${r.period}${PERIOD_LABEL[period]}차</td>
      <td>${fmt(r.interest)}원</td>
      <td>${fmt(r.balance)}원</td>
      <td>${pct >= 0 ? '+' : ''}${fmt2(pct)}%</td>
    </tr>
  `;
  }).join('');
  document.getElementById('loadMoreBtn').style.display = (visibleRows < schedule.length) ? 'inline-block' : 'none';
  document.getElementById('csvDownloadBtn').style.display = 'inline-block';
}

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  visibleRows += 12;
  renderLedger();
});

document.getElementById('csvDownloadBtn').addEventListener('click', ()=>{
  if (!schedule.length) return;
  const amount = document.getElementById('ci-amount').value;
  const rateVal = document.getElementById('ci-rate').value;
  const N = document.getElementById('ci-periods').value;
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  Export.downloadCsv(
    `복리계산_${dateStr}.csv`,
    [`회차(${PERIOD_LABEL[period]})`, '이자', '누적잔액', '원금대비 누적수익률(%)'],
    schedule.map(r=>[r.period, r.interest, r.balance, principal ? Number(((r.balance - principal) / principal * 100).toFixed(2)) : 0]),
    '본 계산 결과는 참고용 시뮬레이션이며, 실제 투자 수익률은 원금 손실 가능성을 포함해 매 기간 달라질 수 있습니다.',
    [
      ['원금(원)', '복리 주기', '주기당 수익률(%)', '총 기간'],
      [amount, PERIOD_LABEL[period], rateVal, N]
    ]
  );
});

const URL_DEFAULTS = {
  amount: '10000000',
  period: toggleDefault('period'),
  rate: document.getElementById('ci-rate').defaultValue,
  periods: document.getElementById('ci-periods').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('ci-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.rate) document.getElementById('ci-rate').value = urlParams.rate;
if (urlParams.periods) document.getElementById('ci-periods').value = urlParams.periods;
if (urlParams.period) clickToggle('period', urlParams.period);

updateDynamicLabels();
recalcAll();
