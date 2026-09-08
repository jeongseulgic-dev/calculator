let savChart = null;
let scheduleData = [];
let visibleRows = 12;
let debounceTimer = null;
let calcMode = 'forward';
let savType = 'deposit';
let periodType = 'month';
let method = 'simple';
let taxRate = 0.154;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.getElementById('s-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('s-amount').value = (1000000).toLocaleString('ko-KR');

document.getElementById('s-target').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('s-target').value = (1035000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ addAmount('s-amount', Number(btn.dataset.add)); scheduleRecalc(); });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{ resetAmount('s-amount'); scheduleRecalc(); });

function updateModeFields(){
  document.querySelectorAll('.mode-field').forEach(f=>{
    f.classList.toggle('hidden', f.dataset.mode !== calcMode);
  });
}

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = group.dataset.target;
      if (target === 'calcMode'){ calcMode = btn.dataset.value; updateModeFields(); }
      if (target === 'savType') savType = btn.dataset.value;
      if (target === 'periodType') periodType = btn.dataset.value;
      if (target === 'method') method = btn.dataset.value;
      if (target === 'taxRate') taxRate = parseFloat(btn.dataset.value);
      scheduleRecalc();
    });
  });
});

['s-period','s-rate'].forEach(id=>{
  document.getElementById(id).addEventListener('input', scheduleRecalc);
});

function scheduleRecalc(){
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(recalcAll, 150);
}

// 목표 금액(FV)을 만드는 데 필요한 이자율을 구하기 위해, 주어진 이자율로 만기 금액을
// 계산하는 함수. 이분탐색(solveRate)에서 "이 이자율이면 얼마가 되는지"를 반복
// 질의하는 용도로 쓰인다. 적금 연복리는 닫힌 형태 공식이 없어 O(개월수) 순회로 계산.
function evaluateFv(P, months, rate, savType, method){
  const monthlyRate = rate / 12;
  if (savType === 'deposit'){
    if (method === 'simple') return P + P * rate * (months / 12);
    if (method === 'compound') return P * Math.pow(1 + monthlyRate, months);
    const years = Math.floor(months / 12), rem = months % 12;
    return P * Math.pow(1 + rate, years) * (1 + rate * rem / 12);
  }
  if (method === 'simple') return P * months + P * rate * (months * (months + 1) / 24);
  if (method === 'compound'){
    return monthlyRate === 0 ? P * months : P * (1 + monthlyRate) * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  }
  // 적금 연복리: 1년마다 그 시점까지의 원금+이자를 잠금(lockedBalance)하고 다음 해부터
  // 그 합산액에 다시 이자가 붙는다. 아직 1년이 안 된 기간의 신규 납입분은 단리로 계산.
  let lockedBalance = 0, yearPrincipal = 0, balance = 0;
  for (let m = 1; m <= months; m++){
    const monthInYear = ((m - 1) % 12) + 1;
    yearPrincipal += P;
    const thisYearInterestSoFar = P * rate * (monthInYear * (monthInYear + 1) / 24);
    balance = lockedBalance + yearPrincipal + thisYearInterestSoFar;
    if (monthInYear === 12){
      lockedBalance = lockedBalance * (1 + rate) + yearPrincipal + thisYearInterestSoFar;
      yearPrincipal = 0;
    }
  }
  return balance;
}

// 목표 금액(target, 세전)을 만드는 데 필요한 연 이자율을 구한다. 단리·예금 월복리는
// 공식을 그대로 뒤집어 정확히 계산하고, 나머지(적금 월복리, 연복리 전체)는 FV가
// 이자율에 대해 항상 증가하는 함수라는 성질을 이용해 이분탐색으로 근사한다.
function solveRate(target, P, months, savType, method){
  if (savType === 'deposit' && method === 'simple'){
    return (target / P - 1) * 12 / months;
  }
  if (savType === 'deposit' && method === 'compound'){
    return 12 * (Math.pow(target / P, 1 / months) - 1);
  }
  if (savType === 'savings' && method === 'simple'){
    const totalPrincipal = P * months;
    return (target - totalPrincipal) / (P * months * (months + 1) / 24);
  }
  let lo = 0, hi = 5;
  while (evaluateFv(P, months, hi, savType, method) < target && hi < 1e4) hi *= 2;
  for (let i = 0; i < 100; i++){
    const mid = (lo + hi) / 2;
    if (evaluateFv(P, months, mid, savType, method) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

function recalcAll(){
  const P = parseFloat(document.getElementById('s-amount').value.replace(/,/g,''));
  const periodVal = parseFloat(document.getElementById('s-period').value);
  const months = periodType === 'year' ? periodVal * 12 : periodVal;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const screenLabel = document.querySelector('.screen .label');
  const meta = document.getElementById('page-meta');
  const statBody = document.getElementById('statBody');

  function showError(msg){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    meta.textContent = '--';
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
    document.getElementById('ledgerBody').innerHTML = '';
    if (savChart) { savChart.destroy(); savChart = null; }
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('csvDownloadBtn').style.display = 'none';
  }

  if (!P || !months){
    showError('금액·기간을 확인해 주세요');
    return;
  }

  let rate, targetVal = null;

  if (calcMode === 'forward'){
    screenLabel.textContent = '세후 예상 수령액';
    rate = parseFloat(document.getElementById('s-rate').value) / 100;
    if (isNaN(rate)){ showError('이자율을 확인해 주세요'); return; }
  } else {
    screenLabel.textContent = '계산된 연 이자율 (세전)';
    targetVal = parseFloat(document.getElementById('s-target').value.replace(/,/g,''));
    const minTarget = savType === 'deposit' ? P : P * months;
    if (!targetVal || targetVal <= minTarget){
      showError('목표 금액은 총 납입 원금보다 커야 합니다');
      return;
    }
    rate = solveRate(targetVal, P, months, savType, method);
    if (!Number.isFinite(rate) || rate < 0){
      showError('입력한 조건으로는 이자율을 계산할 수 없습니다');
      return;
    }
  }

  const monthlyRate = rate / 12;

  if (calcMode === 'forward'){
    meta.textContent = `${savType==='deposit'?'예금':'적금'} · ${fmt(P)}원 · ${months}개월 · 연 ${document.getElementById('s-rate').value}%`;
  } else {
    meta.textContent = `${savType==='deposit'?'예금':'적금'} · ${fmt(P)}원 · ${months}개월 · 목표 ${fmt(targetVal)}원(세전)`;
  }

  let totalPrincipal = 0;
  let preTaxInterest = 0;
  scheduleData = [];

  if (savType === 'deposit'){
    totalPrincipal = P;
    const depositFv = (m) => {
      if (method === 'simple') return P + P * rate * (m / 12);
      if (method === 'compound') return P * Math.pow(1 + monthlyRate, m);
      const years = Math.floor(m / 12), rem = m % 12;
      return P * Math.pow(1 + rate, years) * (1 + rate * rem / 12);
    };
    for (let m = 1; m <= months; m++){
      const cur = depositFv(m) - P;
      const tax = cur * taxRate;
      scheduleData.push({ month:m, principal:P, interest:Math.round(cur), preTax:Math.round(P+cur), afterTax:Math.round(P+cur-tax) });
    }
    preTaxInterest = depositFv(months) - P;
  } else {
    totalPrincipal = P * months;
    // 월복리 적금의 누적이자는 등비수열 합의 닫힌 형태로 계산한다(원래 이중 for문으로
    // 매달 처음부터 다시 합산해 O(월수²)였는데, 기간을 아주 크게 입력하면 브라우저가
    // 멈출 수 있었다 — 영업일 계산기에서 같은 이유로 이미 한 번 고친 것과 같은 종류의 버그).
    const annuityFv = (m) => monthlyRate === 0 ? P * m : P * (1 + monthlyRate) * (Math.pow(1 + monthlyRate, m) - 1) / monthlyRate;

    let cumPrincipal = 0, lockedBalance = 0, yearPrincipal = 0, lastCumInterest = 0;
    for (let m = 1; m <= months; m++){
      cumPrincipal += P;
      let cumInterest;
      if (method === 'simple'){
        cumInterest = P * rate * (m * (m + 1) / 24);
      } else if (method === 'compound'){
        cumInterest = annuityFv(m) - cumPrincipal;
      } else {
        // 적금 연복리: 1년마다 잔액을 잠그고 다음 해부터 그 합산액에 복리 적용,
        // 1년이 안 된 기간의 신규 납입분은 단리로 계산 (evaluateFv와 동일한 방식,
        // 여기서는 매달의 중간값을 전부 남겨야 해서 한 번의 반복문 안에서 함께 처리).
        const monthInYear = ((m - 1) % 12) + 1;
        yearPrincipal += P;
        const thisYearInterestSoFar = P * rate * (monthInYear * (monthInYear + 1) / 24);
        const balance = lockedBalance + yearPrincipal + thisYearInterestSoFar;
        cumInterest = balance - cumPrincipal;
        if (monthInYear === 12){
          lockedBalance = lockedBalance * (1 + rate) + yearPrincipal + thisYearInterestSoFar;
          yearPrincipal = 0;
        }
      }
      lastCumInterest = cumInterest;
      const cumTax = cumInterest * taxRate;
      scheduleData.push({ month:m, principal:cumPrincipal, interest:Math.round(cumInterest), preTax:Math.round(cumPrincipal+cumInterest), afterTax:Math.round(cumPrincipal+cumInterest-cumTax) });
    }
    preTaxInterest = lastCumInterest;
  }

  const taxAmount = preTaxInterest * taxRate;
  const afterTaxInterest = preTaxInterest - taxAmount;
  const finalPayout = totalPrincipal + afterTaxInterest;
  const realYield = totalPrincipal > 0 ? ((afterTaxInterest / totalPrincipal) * 100).toFixed(2) : '0.00';

  if (calcMode === 'forward'){
    miniScreen.textContent = fmt(finalPayout) + '원';
    miniScreenSub.textContent = '세후 예상 수령액';
    statBody.innerHTML = `
      <tr><th>총 납입 원금</th><td>${fmt(totalPrincipal)}원</td></tr>
      <tr><th>세전 이자</th><td>${fmt(preTaxInterest)}원</td></tr>
      <tr><th>원천징수 세금</th><td>-${fmt(taxAmount)}원</td></tr>
      <tr class="stat-highlight"><th>세후 실질 이자</th><td>${fmt(afterTaxInterest)}원</td></tr>
      <tr><th>세후 실질 수익률</th><td>+${realYield}%</td></tr>
    `;
  } else {
    miniScreen.textContent = (rate * 100).toFixed(2) + '%';
    miniScreenSub.textContent = '계산된 연 이자율 (세전)';
    statBody.innerHTML = `
      <tr><th>총 납입 원금</th><td>${fmt(totalPrincipal)}원</td></tr>
      <tr><th>목표 금액 (세전)</th><td>${fmt(targetVal)}원</td></tr>
      <tr class="stat-highlight"><th>계산된 연 이자율</th><td>${(rate * 100).toFixed(2)}%</td></tr>
      <tr><th>세전 이자</th><td>${fmt(preTaxInterest)}원</td></tr>
      <tr><th>세후 실질 수령액</th><td>${fmt(finalPayout)}원</td></tr>
      <tr><th>세후 실질 수익률</th><td>+${realYield}%</td></tr>
    `;
  }

  renderChart(totalPrincipal, Math.round(afterTaxInterest), Math.round(taxAmount));
  visibleRows = 12;
  renderLedger();

  UrlState.sync({
    amount: P, period: periodVal, periodUnit: periodType, rate: document.getElementById('s-rate').value,
    target: calcMode === 'reverse' ? targetVal : '', calcMode, savType, method, taxRate
  }, URL_DEFAULTS);
}

function renderChart(principal, interest, tax){
  const ctx = document.getElementById('savChart').getContext('2d');
  if (savChart) savChart.destroy();
  savChart = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['납입 원금','세후 이자','원천징수 세금'],
      datasets:[{ data:[principal, interest, tax], backgroundColor:['#373b40','#c23662','#9ca0a6'], borderWidth:1 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{size:10} } } }
    }
  });
}

function renderLedger(){
  const body = document.getElementById('ledgerBody');
  const rows = scheduleData.slice(0, visibleRows);
  body.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.month}회차</td>
      <td>${fmt(r.principal)}원</td>
      <td>${fmt(r.interest)}원</td>
      <td>${fmt(r.preTax)}원</td>
      <td style="color:var(--pink); font-weight:700;">${fmt(r.afterTax)}원</td>
    </tr>
  `).join('');
  document.getElementById('loadMoreBtn').style.display = (visibleRows < scheduleData.length) ? 'inline-block' : 'none';
  document.getElementById('csvDownloadBtn').style.display = 'inline-block';
}

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  visibleRows += 12;
  renderLedger();
});

document.getElementById('csvDownloadBtn').addEventListener('click', ()=>{
  if (!scheduleData.length) return;
  const d = new Date();
  const dateStr = d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  Export.downloadCsv(
    `예적금계산_${dateStr}.csv`,
    ['회차','납입원금','이자','세전 금액','세후 금액'],
    scheduleData.map(r=>[r.month, r.principal, r.interest, r.preTax, r.afterTax]),
    '본 계산 결과는 참고용이며, 실제 수령액은 금융기관 상품 조건 및 세금 적용 방식에 따라 달라질 수 있습니다.'
  );
});

const URL_DEFAULTS = {
  amount: '1000000',
  period: document.getElementById('s-period').defaultValue,
  periodUnit: toggleDefault('periodType'),
  rate: document.getElementById('s-rate').defaultValue,
  target: '',
  calcMode: toggleDefault('calcMode'),
  savType: toggleDefault('savType'),
  method: toggleDefault('method'),
  taxRate: toggleDefault('taxRate')
};

const urlParams = UrlState.read();
if (urlParams.amount) document.getElementById('s-amount').value = Number(urlParams.amount).toLocaleString('ko-KR');
if (urlParams.period) document.getElementById('s-period').value = urlParams.period;
if (urlParams.rate) document.getElementById('s-rate').value = urlParams.rate;
if (urlParams.target) document.getElementById('s-target').value = Number(urlParams.target).toLocaleString('ko-KR');
if (urlParams.periodUnit) clickToggle('periodType', urlParams.periodUnit);
if (urlParams.calcMode) clickToggle('calcMode', urlParams.calcMode);
if (urlParams.savType) clickToggle('savType', urlParams.savType);
if (urlParams.method) clickToggle('method', urlParams.method);
if (urlParams.taxRate) clickToggle('taxRate', urlParams.taxRate);

updateModeFields();
recalcAll();
