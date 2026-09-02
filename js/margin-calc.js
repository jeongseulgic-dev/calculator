let mode = 'margin';

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
function pct(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '%'; }

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

  if (mode === 'margin'){
    const cost = parseFloat(document.getElementById('mg-cost').value.replace(/,/g, ''));
    const price = parseFloat(document.getElementById('mg-price').value.replace(/,/g, ''));
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price <= 0){
      fail('원가(0 이상)와 판매가(0보다 큼)를 입력해 주세요');
      return;
    }
    const profit = price - cost;
    const marginOnPrice = profit / price * 100;
    const markupOnCost = cost > 0 ? profit / cost * 100 : Infinity;

    miniScreen.textContent = fmt(profit) + '원';
    miniScreenSub.textContent = '마진액';
    meta.textContent = `원가 ${fmt(cost)}원 · 판매가 ${fmt(price)}원`;
    statBody.innerHTML = `
      <tr><th>원가</th><td>${fmt(cost)}원</td></tr>
      <tr><th>판매가</th><td>${fmt(price)}원</td></tr>
      <tr class="stat-highlight"><th>마진액</th><td>${fmt(profit)}원</td></tr>
      <tr class="stat-highlight"><th>마진율 (판매가 기준)</th><td>${pct(marginOnPrice)}</td></tr>
      <tr><th>마크업율 (원가 기준)</th><td>${cost > 0 ? pct(markupOnCost) : '∞'}</td></tr>
    `;
    UrlState.sync({ mode, cost, price }, URL_DEFAULTS);
  }

  else if (mode === 'discount'){
    const list = parseFloat(document.getElementById('mg-list').value.replace(/,/g, ''));
    const sale = parseFloat(document.getElementById('mg-sale').value.replace(/,/g, ''));
    if (!Number.isFinite(list) || list <= 0 || !Number.isFinite(sale) || sale < 0){
      fail('정가(0보다 큼)와 할인가(0 이상)를 입력해 주세요');
      return;
    }
    const discount = list - sale;
    const discountPct = discount / list * 100;

    miniScreen.textContent = pct(discountPct);
    miniScreenSub.textContent = '할인율';
    meta.textContent = `정가 ${fmt(list)}원 · 할인가 ${fmt(sale)}원`;
    statBody.innerHTML = `
      <tr><th>정가</th><td>${fmt(list)}원</td></tr>
      <tr><th>할인가</th><td>${fmt(sale)}원</td></tr>
      <tr class="stat-highlight"><th>할인액</th><td>${fmt(discount)}원</td></tr>
      <tr class="stat-highlight"><th>할인율</th><td>${pct(discountPct)}</td></tr>
    `;
    UrlState.sync({ mode, list, sale }, URL_DEFAULTS);
  }
}

document.getElementById('mg-cost').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('mg-price').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('mg-list').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('mg-sale').addEventListener('input', function(){ formatInputComma(this); recalc(); });

const URL_DEFAULTS = { mode: 'margin', cost: '7000', price: '10000', list: '50000', sale: '35000' };

const urlParams = UrlState.read();
document.getElementById('mg-cost').value = Number(urlParams.cost || URL_DEFAULTS.cost).toLocaleString('ko-KR');
document.getElementById('mg-price').value = Number(urlParams.price || URL_DEFAULTS.price).toLocaleString('ko-KR');
document.getElementById('mg-list').value = Number(urlParams.list || URL_DEFAULTS.list).toLocaleString('ko-KR');
document.getElementById('mg-sale').value = Number(urlParams.sale || URL_DEFAULTS.sale).toLocaleString('ko-KR');
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
