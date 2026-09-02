let mode = 'supply';
const VAT_RATE = 0.1;

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== mode);
    });
    recalc();
  });
});

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'supply'){
    const supply = parseFloat(document.getElementById('vat-supply').value.replace(/,/g, ''));
    if (!Number.isFinite(supply) || supply < 0){ fail('공급가액(0 이상)을 입력해 주세요'); return; }
    const vat = supply * VAT_RATE;
    const total = supply + vat;
    miniScreen.textContent = fmt(total) + '원';
    miniScreenSub.textContent = '합계금액(공급대가)';
    meta.textContent = `공급가액 ${fmt(supply)}원`;
    statBody.innerHTML = `
      <tr><th>공급가액</th><td>${fmt(supply)}원</td></tr>
      <tr class="stat-highlight"><th>부가세(10%)</th><td>${fmt(vat)}원</td></tr>
      <tr class="stat-highlight"><th>합계금액</th><td>${fmt(total)}원</td></tr>
    `;
    UrlState.sync({ mode, supply }, URL_DEFAULTS);
  }

  else if (mode === 'total'){
    const total = parseFloat(document.getElementById('vat-total').value.replace(/,/g, ''));
    if (!Number.isFinite(total) || total < 0){ fail('합계금액(0 이상)을 입력해 주세요'); return; }
    const supply = total / (1 + VAT_RATE);
    const vat = total - supply;
    miniScreen.textContent = fmt(supply) + '원';
    miniScreenSub.textContent = '공급가액';
    meta.textContent = `합계금액 ${fmt(total)}원`;
    statBody.innerHTML = `
      <tr><th>합계금액</th><td>${fmt(total)}원</td></tr>
      <tr class="stat-highlight"><th>공급가액</th><td>${fmt(supply)}원</td></tr>
      <tr class="stat-highlight"><th>부가세(10%)</th><td>${fmt(vat)}원</td></tr>
    `;
    UrlState.sync({ mode, total }, URL_DEFAULTS);
  }
}

document.getElementById('vat-supply').addEventListener('input', (e)=>{ formatInputComma(e.target); recalc(); });
document.getElementById('vat-total').addEventListener('input', (e)=>{ formatInputComma(e.target); recalc(); });

const URL_DEFAULTS = { mode: 'supply', supply: '1000000', total: '1100000' };

const urlParams = UrlState.read();
document.getElementById('vat-supply').value = Number(urlParams.supply || URL_DEFAULTS.supply).toLocaleString('ko-KR');
document.getElementById('vat-total').value = Number(urlParams.total || URL_DEFAULTS.total).toLocaleString('ko-KR');
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
