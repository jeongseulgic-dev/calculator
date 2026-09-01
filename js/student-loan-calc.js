let mode = 'general';
let degree = 20;
let compareChart = null;
let scheduleCache = {};
let visibleRows = 12;
let activeType = 'equal-principal-interest';
let lastInputs = {};

const METHODS = [
  { key:'equal-principal-interest', label:'원리금균등상환', tag:'매달 동일' },
  { key:'equal-principal',          label:'원금균등상환',   tag:'원금 우선' }
];

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.getElementById('g-amount').addEventListener('input', function(){ formatInputComma(this); recalcAll(); });

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    addAmount('g-amount', Number(btn.dataset.add));
    recalcAll();
  });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{
  resetAmount('g-amount');
  recalcAll();
});

['g-rate','g-grace','g-repay'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalcAll);
});

document.getElementById('i-salary').addEventListener('input', function(){ formatInputComma(this); recalcAll(); });
document.getElementById('i-threshold').addEventListener('input', function(){ formatInputComma(this); recalcAll(); });

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'mode'){
        mode = btn.dataset.value;
        document.querySelectorAll('.mode-field').forEach(f=>{
          f.classList.toggle('hidden', f.dataset.mode !== mode);
        });
      } else if (group.dataset.target === 'degree'){
        degree = parseInt(btn.dataset.value);
      }
      recalcAll();
    });
  });
});

function computeSchedule(P, totalMonths, monthlyRate, graceMonths, type){
  let balance = P;
  let totalInterest = 0;
  const repayMonths = totalMonths - graceMonths;
  const schedule = [];

  let monthlyConstant = 0;
  if (type === 'equal-principal-interest' && repayMonths > 0) {
    monthlyConstant = (P * monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) / (Math.pow(1 + monthlyRate, repayMonths) - 1);
  }
  let fixedPrincipal = (type === 'equal-principal' && repayMonths > 0) ? P / repayMonths : 0;

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
    }

    if (principalPayment > balance) principalPayment = balance;
    balance -= principalPayment;
    if (balance < 0) balance = 0;

    totalInterest += interestPayment;

    schedule.push({
      month:m, principal:Math.round(principalPayment), interest:Math.round(interestPayment),
      total:Math.round(principalPayment + interestPayment), balance:Math.round(balance)
    });
  }
  return { schedule, totalInterest };
}

function recalcAll(){
  if (mode === 'general') recalcGeneral();
  else recalcIcl();
}

function recalcGeneral(){
  const P = parseFloat(document.getElementById('g-amount').value.replace(/,/g,''));
  const graceYears = parseFloat(document.getElementById('g-grace').value) || 0;
  const repayYears = parseFloat(document.getElementById('g-repay').value) || 0;
  const graceMonths = graceYears * 12;
  const repayMonths = repayYears * 12;
  const totalMonths = graceMonths + repayMonths;

  const rate = parseFloat(document.getElementById('g-rate').value) / 100;
  const monthlyRate = rate / 12;

  const grid = document.getElementById('compareGrid');
  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const miniScreenLabel = document.getElementById('miniScreenLabel');

  miniScreenLabel.textContent = '최저 총이자';

  if (!P || repayMonths <= 0 || isNaN(rate)){
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">원금·거치기간·상환기간·금리를 확인해 주세요 (상환기간은 1년 이상이어야 합니다)</div>';
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

  meta.textContent = `원금 ${fmt(P)}원 · 거치${graceYears}년+상환${repayYears}년 · 연 ${document.getElementById('g-rate').value}%`;

  lastInputs = { amount:P, graceYears, repayYears, rate: document.getElementById('g-rate').value };

  scheduleCache = {};
  METHODS.forEach(m=>{
    scheduleCache[m.key] = computeSchedule(P, totalMonths, monthlyRate, graceMonths, m.key);
  });

  const bestKey = scheduleCache[METHODS[0].key].totalInterest <= scheduleCache[METHODS[1].key].totalInterest
    ? METHODS[0].key : METHODS[1].key;
  const bestLabel = METHODS.find(m=>m.key===bestKey).label;

  miniScreen.textContent = fmt(scheduleCache[bestKey].totalInterest) + '원';
  miniScreenSub.textContent = `${bestLabel} 기준`;

  grid.innerHTML = METHODS.map(m=>{
    const data = scheduleCache[m.key];
    const firstRepayRow = data.schedule[graceMonths] || data.schedule[0];
    const firstPayment = firstRepayRow ? firstRepayRow.total : 0;
    const totalRepay = P + data.totalInterest;
    const isBest = m.key === bestKey;
    return `
      <div class="method-card">
        ${isBest ? '<div class="stamp">이자<br>최적</div>' : ''}
        <h3>${m.label}</h3>
        <div class="sub">${m.tag}</div>
        <div class="method-row"><span>상환개시 첫 달 상환액</span><span class="val">${fmt(firstPayment)}원</span></div>
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
    mode, amount: P, grace: graceYears, repay: repayYears, rate: document.getElementById('g-rate').value
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
        backgroundColor: ['#373b40', '#c23662'],
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
  const methodLabel = METHODS.find(m=>m.key===activeType).label;
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  Export.downloadCsv(
    `학자금대출계산_${methodLabel}_${dateStr}.csv`,
    ['회차','납입원금','납입이자','월 상환액','대출잔액'],
    data.schedule.map(r=>[r.month, r.principal, r.interest, r.total, r.balance]),
    '본 계산 결과는 참고용이며, 실제 상환 금액은 한국장학재단의 확정 금리·조건에 따라 달라질 수 있습니다.',
    [
      ['원금(원)','거치기간(년)','상환기간(년)','연이자율(%)','상환방식'],
      [lastInputs.amount, lastInputs.graceYears, lastInputs.repayYears, lastInputs.rate, methodLabel]
    ]
  );
});

function recalcIcl(){
  const salary = parseFloat(document.getElementById('i-salary').value.replace(/,/g,''));
  const threshold = parseFloat(document.getElementById('i-threshold').value.replace(/,/g,''));
  const rate = degree / 100;

  const meta = document.getElementById('page-meta');
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const miniScreenLabel = document.getElementById('miniScreenLabel');
  const statBody = document.getElementById('iclStatBody');

  miniScreenLabel.textContent = '의무상환액 (연)';

  if (!salary || isNaN(threshold) || threshold < 0){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">총급여와 상환기준소득을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const degreeLabel = degree === 25 ? '대학원' : '학부';
  meta.textContent = `총급여 ${fmt(salary)}원 · 상환기준 ${fmt(threshold)}원 · ${degreeLabel}`;

  const excess = Math.max(0, salary - threshold);

  if (excess <= 0){
    miniScreen.textContent = '유예';
    miniScreenSub.textContent = '총급여가 상환기준소득 이하';
    statBody.innerHTML = `
      <tr><th>총급여</th><td>${fmt(salary)}원</td></tr>
      <tr><th>상환기준소득</th><td>${fmt(threshold)}원</td></tr>
      <tr class="stat-highlight"><th>의무상환액</th><td>상환 유예 대상</td></tr>
    `;
  } else {
    const dutyAmount = Math.max(excess * rate, 360000);
    const monthlyAvg = dutyAmount / 12;
    miniScreen.textContent = fmt(dutyAmount) + '원';
    miniScreenSub.textContent = `월평균 약 ${fmt(monthlyAvg)}원`;
    statBody.innerHTML = `
      <tr><th>총급여</th><td>${fmt(salary)}원</td></tr>
      <tr><th>상환기준 초과소득</th><td>${fmt(excess)}원</td></tr>
      <tr><th>적용 상환율</th><td>${degree}% (${degreeLabel})</td></tr>
      <tr class="stat-highlight"><th>의무상환액 (연)</th><td>${fmt(dutyAmount)}원</td></tr>
    `;
  }

  UrlState.sync({ mode, salary, threshold, degree }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  amount: '',
  grace: document.getElementById('g-grace').defaultValue,
  repay: document.getElementById('g-repay').defaultValue,
  rate: document.getElementById('g-rate').defaultValue,
  salary: '',
  threshold: '28510000',
  degree: toggleDefault('degree')
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('g-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.grace) document.getElementById('g-grace').value = urlParams.grace;
if (urlParams.repay) document.getElementById('g-repay').value = urlParams.repay;
if (urlParams.rate) document.getElementById('g-rate').value = urlParams.rate;
if (urlParams.salary) document.getElementById('i-salary').value = Number(urlParams.salary).toLocaleString('ko-KR');
if (urlParams.threshold) document.getElementById('i-threshold').value = Number(urlParams.threshold).toLocaleString('ko-KR');
if (urlParams.degree) clickToggle('degree', urlParams.degree);
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalcAll();
