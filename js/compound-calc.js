let compoundChart = null;
let schedule = [];
let visibleRows = 12;
let calcMode = 'forward';
let period = 'day';
let debounceTimer = null;
let principal = 0;
let lastN = 0;
let contrib = 0;

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

function updateModeFields(){
  document.querySelectorAll('.mode-field').forEach(f=>{
    f.classList.toggle('hidden', f.dataset.mode !== calcMode);
  });
}

document.getElementById('ci-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('ci-amount').value = (100000).toLocaleString('ko-KR');

document.getElementById('ci-target').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('ci-contrib').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('ci-target').value = (120000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount(btn.dataset.target, Number(btn.dataset.add));
    scheduleRecalc();
  });
});
document.querySelectorAll('.calc-key[data-reset]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    resetAmount(btn.dataset.target);
    scheduleRecalc();
  });
});

document.querySelectorAll('.seg-toggle[data-target="calcMode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="calcMode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    calcMode = btn.dataset.value;
    updateModeFields();
    scheduleRecalc();
  });
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

// C: 매 주기 끝에 추가로 넣는 금액(적립식). 이자가 붙은 뒤 납입한다고 본다.
function computeSchedule(P, rate, N, C = 0){
  let balance = P;
  let invested = P;
  const rows = [];
  const wholePeriods = Math.floor(N + 1e-9);
  for (let n = 1; n <= wholePeriods; n++){
    const interest = balance * rate;
    balance += interest + C;
    invested += C;
    rows.push({ period: n, interest: Math.round(interest), invested: Math.round(invested), balance: Math.round(balance) });
  }
  // 소수 기간(예: 155.8일) 입력 시, 남은 부분 기간(0.8일)만큼 지수를 그대로 적용해
  // 마지막 행을 채운다 — 역산 기능이 로그 공식(연속 복리 관점)으로 정확한 소수
  // 기간을 계산해 주는데, 정방향 계산기가 정수만 받으면 그 값을 다시 넣어봐도
  // 정수로 잘려 목표 금액과 어긋난다는 사용자 지적으로 추가.
  const frac = N - wholePeriods;
  if (frac > 1e-9){
    const newBalance = balance * Math.pow(1 + rate, frac);
    const interest = newBalance - balance;
    rows.push({ period: Math.round(N * 100) / 100, interest: Math.round(interest), invested: Math.round(invested), balance: Math.round(newBalance) });
    balance = newBalance;
  }
  // 단리 비교: 원금과 각 회차 적립금이 남은 기간만큼만 단리로 이자를 받는다고 본다
  let simpleTotal = P * (1 + rate * N);
  for (let k = 1; k <= wholePeriods; k++) simpleTotal += C * (1 + rate * (N - k));
  return { rows, finalBalance: balance, simpleTotal, invested };
}

// 목표 금액에 도달하는 데 필요한 주기 수(n)를 구한다. 복리 공식(FV = P×(1+r)ⁿ)은
// n에 대해 로그로 정확히 풀리므로 역산에 수치해법이 필요 없다.
// 적립금 C가 있으면 FV = P(1+r)ⁿ + C·((1+r)ⁿ − 1)/r 를 n에 대해 풀어
// n = log((FV·r + C) ÷ (P·r + C)) ÷ log(1 + r)
function solvePeriods(target, P, rate, C = 0){
  if (C > 0){
    if (rate === 0) return (target - P) / C;
    return Math.log((target * rate + C) / (P * rate + C)) / Math.log(1 + rate);
  }
  return Math.log(target / P) / Math.log(1 + rate);
}

function recalcAll(){
  const P = Number(document.getElementById('ci-amount').value.replace(/,/g, ''));
  const rateVal = document.getElementById('ci-rate').value;
  const rate = parseFloat(rateVal) / 100;
  const C = Math.max(0, Number(document.getElementById('ci-contrib').value.replace(/,/g, '')) || 0);
  contrib = C;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  function showError(msg){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
    meta.textContent = '--';
    if (compoundChart) { compoundChart.destroy(); compoundChart = null; }
    document.getElementById('ledgerBody').innerHTML = '';
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('csvDownloadBtn').style.display = 'none';
  }

  if ((!(P > 0) && !(C > 0)) || P < 0 || isNaN(rate)){
    showError('원금·수익률을 확인해 주세요');
    return;
  }

  let N, targetVal = null, exactN = null;

  if (calcMode === 'forward'){
    N = parseFloat(document.getElementById('ci-periods').value);
    if (!(N > 0)){
      showError('투자 기간을 확인해 주세요');
      return;
    }
  } else {
    targetVal = Number(document.getElementById('ci-target').value.replace(/,/g, ''));
    if (!targetVal){
      showError('목표 금액을 확인해 주세요');
      return;
    }
    exactN = solvePeriods(targetVal, P, rate, C);
    if (!Number.isFinite(exactN) || exactN < 0){
      showError('이 조건으로는 목표 금액에 도달하는 기간을 계산할 수 없습니다 (수익률·목표 금액의 방향을 확인해 주세요)');
      return;
    }
    N = Math.max(1, Math.ceil(exactN - 1e-6));   // 원 단위 반올림 오차(240.0000003개월 등)로 한 주기 더 올라가지 않게
  }

  const result = computeSchedule(P, rate, N, C);
  schedule = result.rows;
  principal = P;
  lastN = N;
  const invested = result.invested;
  const totalInterest = result.finalBalance - invested;
  const simpleInterest = result.simpleTotal - invested;
  const compoundEffect = result.finalBalance - result.simpleTotal;
  const yieldPct = (totalInterest / invested) * 100;
  const unit = PERIOD_LABEL[period];
  // 원금 2배 기간: 정확한 값 ln2/ln(1+r)과 72의 법칙 어림값(72 ÷ 수익률%)
  const doubling = rate > 0 ? Math.log(2) / Math.log(1 + rate) : null;
  const doublingRow = (C === 0 && doubling)
    ? `<tr><th>원금 2배까지<span class="sim-sub">72의 법칙 어림 ${fmt2(72 / (rate * 100))}${unit}</span></th><td>${fmt2(doubling)}${unit}</td></tr>` : '';
  const investedRow = C > 0
    ? `<tr><th>총 납입 원금<span class="sim-sub">원금 + ${unit}마다 ${fmt(C)}원</span></th><td>${fmt(invested)}원</td></tr>`
    : `<tr><th>원금</th><td>${fmt(P)}원</td></tr>`;

  if (calcMode === 'forward'){
    miniScreen.textContent = fmt(result.finalBalance) + '원';
    miniScreenSub.textContent = `총 수익 +${fmt(totalInterest)}원 (${fmt2(yieldPct)}%)`;
    statBody.innerHTML = `
      ${investedRow}
      <tr class="stat-highlight"><th>복리 최종 금액</th><td>${fmt(result.finalBalance)}원</td></tr>
      <tr><th>총 수익 (복리)</th><td>+${fmt(totalInterest)}원</td></tr>
      <tr><th>총 수익률 (복리)${C > 0 ? '<span class="sim-sub">납입 원금 대비</span>' : ''}</th><td>+${fmt2(yieldPct)}%</td></tr>
      <tr><th>단리였다면</th><td>${fmt(result.simpleTotal)}원<span class="sim-sub">수익 +${fmt(simpleInterest)}원</span></td></tr>
      <tr><th>복리 효과</th><td>+${fmt(compoundEffect)}원</td></tr>
      ${doublingRow}
    `;
    meta.textContent = `원금 ${fmt(P)}원${C > 0 ? ` · ${unit}마다 ${fmt(C)}원` : ''} · ${unit}복리 ${rateVal}% · ${fmt2(N)}${unit}`;
  } else {
    miniScreen.textContent = fmt2(exactN) + PERIOD_LABEL[period];
    miniScreenSub.textContent = `목표 ${fmt(targetVal)}원 도달까지`;
    statBody.innerHTML = `
      <tr><th>원금</th><td>${fmt(P)}원</td></tr>
      ${C > 0 ? `<tr><th>${unit}마다 추가 투자</th><td>${fmt(C)}원</td></tr>` : ''}
      <tr><th>목표 금액</th><td>${fmt(targetVal)}원</td></tr>
      <tr class="stat-highlight"><th>필요한 주기 수</th><td>${fmt2(exactN)}${PERIOD_LABEL[period]}</td></tr>
      <tr><th>${N}${PERIOD_LABEL[period]}차 예상 금액</th><td>${fmt(result.finalBalance)}원</td></tr>
      ${C > 0 ? `<tr><th>그때까지 납입 원금</th><td>${fmt(invested)}원</td></tr>` : ''}
      <tr><th>예상 총 수익</th><td>+${fmt(totalInterest)}원<span class="sim-sub">${fmt2(yieldPct)}%</span></td></tr>
    `;
    meta.textContent = `원금 ${fmt(P)}원${C > 0 ? ` · ${unit}마다 ${fmt(C)}원` : ''} · ${unit}복리 ${rateVal}% · 목표 ${fmt(targetVal)}원`;
  }

  renderChart();
  visibleRows = 12;
  renderLedger();
  updateDynamicLabels();

  UrlState.sync({
    amount: P, period, rate: rateVal, periods: calcMode === 'forward' ? N : '',
    target: calcMode === 'reverse' ? targetVal : '', calcMode, contrib: C || ''
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
    const pct = r.invested ? (r.balance - r.invested) / r.invested * 100 : 0;
    return `
    <tr>
      <td>${r.period}${PERIOD_LABEL[period]}차</td>
      <td>${fmt(r.interest)}원</td>
      <td>${fmt(r.invested)}원</td>
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
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  Export.downloadCsv(
    `복리계산_${dateStr}.csv`,
    [`회차(${PERIOD_LABEL[period]})`, '이자', '누적 납입', '누적잔액', '납입대비 누적수익률(%)'],
    schedule.map(r=>[r.period, r.interest, r.invested, r.balance, r.invested ? Number(((r.balance - r.invested) / r.invested * 100).toFixed(2)) : 0]),
    '본 계산 결과는 참고용 시뮬레이션이며, 실제 투자 수익률은 원금 손실 가능성을 포함해 매 기간 달라질 수 있습니다.',
    [
      ['원금(원)', '주기마다 추가 투자(원)', '복리 주기', '주기당 수익률(%)', '총 기간'],
      [amount, contrib, PERIOD_LABEL[period], rateVal, lastN]
    ]
  );
});

const URL_DEFAULTS = {
  amount: '100000',
  period: toggleDefault('period'),
  rate: document.getElementById('ci-rate').defaultValue,
  periods: document.getElementById('ci-periods').defaultValue,
  target: '',
  calcMode: toggleDefault('calcMode')
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('ci-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.rate) document.getElementById('ci-rate').value = urlParams.rate;
if (urlParams.periods) document.getElementById('ci-periods').value = urlParams.periods;
if (urlParams.target) document.getElementById('ci-target').value = Number(urlParams.target).toLocaleString('ko-KR');
if (urlParams.contrib) document.getElementById('ci-contrib').value = Number(urlParams.contrib).toLocaleString('ko-KR');
if (urlParams.period) clickToggle('period', urlParams.period);
if (urlParams.calcMode) clickToggle('calcMode', urlParams.calcMode);

updateModeFields();
updateDynamicLabels();
recalcAll();
