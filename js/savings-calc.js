let savChart = null;
let scheduleData = [];
let visibleRows = 12;
let debounceTimer = null;
let savType = 'deposit';
let periodType = 'month';
let method = 'simple';
let taxRate = 0.154;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.getElementById('s-amount').addEventListener('input', function(){ formatInputComma(this); scheduleRecalc(); });
document.getElementById('s-amount').value = (1000000).toLocaleString('ko-KR');

document.querySelectorAll('.calc-key[data-add]').forEach(btn=>{
  btn.addEventListener('click', ()=>{ addAmount('s-amount', Number(btn.dataset.add)); scheduleRecalc(); });
});
document.querySelector('.calc-key[data-reset]').addEventListener('click', ()=>{ resetAmount('s-amount'); scheduleRecalc(); });

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = group.dataset.target;
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

function recalcAll(){
  const P = parseFloat(document.getElementById('s-amount').value.replace(/,/g,''));
  const periodVal = parseFloat(document.getElementById('s-period').value);
  const months = periodType === 'year' ? periodVal * 12 : periodVal;
  const rate = parseFloat(document.getElementById('s-rate').value) / 100;
  const monthlyRate = rate / 12;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const meta = document.getElementById('page-meta');
  const statBody = document.getElementById('statBody');

  if (!P || !months || isNaN(rate)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    meta.textContent = '--';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">금액·기간·이자율을 확인해 주세요</td></tr>';
    document.getElementById('ledgerBody').innerHTML = '';
    if (savChart) { savChart.destroy(); savChart = null; }
    return;
  }

  meta.textContent = `${savType==='deposit'?'예금':'적금'} · ${fmt(P)}원 · ${months}개월 · 연 ${document.getElementById('s-rate').value}%`;

  let totalPrincipal = 0;
  let preTaxInterest = 0;
  scheduleData = [];

  if (savType === 'deposit'){
    totalPrincipal = P;
    preTaxInterest = (method === 'simple')
      ? P * rate * (months / 12)
      : P * Math.pow(1 + monthlyRate, months) - P;

    for (let m = 1; m <= months; m++){
      const cur = (method === 'simple') ? (P * rate * (m/12)) : (P * Math.pow(1+monthlyRate, m) - P);
      const tax = cur * taxRate;
      scheduleData.push({ month:m, principal:P, interest:Math.round(cur), preTax:Math.round(P+cur), afterTax:Math.round(P+cur-tax) });
    }
  } else {
    totalPrincipal = P * months;
    if (method === 'simple'){
      preTaxInterest = P * rate * (months * (months + 1) / 24);
    } else {
      let sum = 0;
      for (let i = 1; i <= months; i++) sum += P * Math.pow(1+monthlyRate, i);
      preTaxInterest = sum - totalPrincipal;
    }

    let cumPrincipal = 0;
    for (let m = 1; m <= months; m++){
      cumPrincipal += P;
      let cumInterest;
      if (method === 'simple'){
        cumInterest = P * rate * (m * (m+1) / 24);
      } else {
        let tempSum = 0;
        for (let k = 1; k <= m; k++) tempSum += P * Math.pow(1+monthlyRate, m-k+1);
        cumInterest = tempSum - cumPrincipal;
      }
      const cumTax = cumInterest * taxRate;
      scheduleData.push({ month:m, principal:cumPrincipal, interest:Math.round(cumInterest), preTax:Math.round(cumPrincipal+cumInterest), afterTax:Math.round(cumPrincipal+cumInterest-cumTax) });
    }
  }

  const taxAmount = preTaxInterest * taxRate;
  const afterTaxInterest = preTaxInterest - taxAmount;
  const finalPayout = totalPrincipal + afterTaxInterest;
  const realYield = totalPrincipal > 0 ? ((afterTaxInterest / totalPrincipal) * 100).toFixed(2) : '0.00';

  miniScreen.textContent = fmt(finalPayout) + '원';
  miniScreenSub.textContent = '세후 예상 수령액';

  statBody.innerHTML = `
    <tr><th>총 납입 원금</th><td>${fmt(totalPrincipal)}원</td></tr>
    <tr><th>세전 이자</th><td>${fmt(preTaxInterest)}원</td></tr>
    <tr><th>원천징수 세금</th><td>-${fmt(taxAmount)}원</td></tr>
    <tr class="stat-highlight"><th>세후 실질 이자</th><td>${fmt(afterTaxInterest)}원</td></tr>
    <tr><th>세후 실질 수익률</th><td>+${realYield}%</td></tr>
  `;

  renderChart(totalPrincipal, Math.round(afterTaxInterest), Math.round(taxAmount));
  visibleRows = 12;
  renderLedger();
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
}

document.getElementById('loadMoreBtn').addEventListener('click', ()=>{
  visibleRows += 12;
  renderLedger();
});

recalcAll();
