let method = 'straight';

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle[data-target="method"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="method"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    method = btn.dataset.value;
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
  const cost = parseFloat(document.getElementById('dp-cost').value.replace(/,/g, ''));
  const residualPct = parseFloat(document.getElementById('dp-residual').value);
  const life = parseInt(document.getElementById('dp-life').value, 10);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(residualPct) || residualPct < 0 || residualPct >= 100 || !Number.isFinite(life) || life < 1 || life > 50){
    fail('취득가액(0보다 큼), 잔존가치율(0~100% 미만), 내용연수(1~50년)를 입력해 주세요');
    return;
  }

  const residual = cost * residualPct / 100;
  const methodLabel = method === 'straight' ? '정액법' : '정률법';
  let rows = [];
  let firstYearDep;

  if (method === 'straight'){
    const annual = (cost - residual) / life;
    let bookValue = cost;
    for (let y = 1; y <= life; y++){
      bookValue -= annual;
      rows.push({ year: y, dep: annual, bookValue: Math.max(bookValue, residual) });
    }
    firstYearDep = annual;
  } else {
    const rate = 1 - Math.pow(residualPct / 100, 1 / life);
    let bookValue = cost;
    for (let y = 1; y <= life; y++){
      const dep = bookValue * rate;
      bookValue -= dep;
      rows.push({ year: y, dep, bookValue });
    }
    firstYearDep = rows[0].dep;
    document.getElementById('dp-rateNote').textContent = `적용 상각률: ${(rate * 100).toFixed(2)}%`;
  }
  if (method === 'straight') document.getElementById('dp-rateNote').textContent = '';

  miniScreen.textContent = fmt(firstYearDep) + '원';
  miniScreenSub.textContent = `${methodLabel} · 1년차 상각비`;
  meta.textContent = `취득가액 ${fmt(cost)}원 · ${methodLabel} · ${life}년`;

  statBody.innerHTML = `
    <tr><th>취득가액</th><td>${fmt(cost)}원</td></tr>
    <tr><th>잔존가치(${residualPct}%)</th><td>${fmt(residual)}원</td></tr>
    <tr><th>상각 방법</th><td>${methodLabel}</td></tr>
  ` + rows.map(r => `<tr${r.year === 1 ? ' class="stat-highlight"' : ''}><th>${r.year}년차 상각비 / 기말장부가액</th><td>${fmt(r.dep)}원 / ${fmt(r.bookValue)}원</td></tr>`).join('');

  UrlState.sync({ method, cost, residual: residualPct, life }, URL_DEFAULTS);
}

document.getElementById('dp-cost').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('dp-residual').addEventListener('input', recalc);
document.getElementById('dp-life').addEventListener('input', recalc);

const URL_DEFAULTS = { method: 'straight', cost: '10000000', residual: document.getElementById('dp-residual').defaultValue, life: document.getElementById('dp-life').defaultValue };

const urlParams = UrlState.read();
document.getElementById('dp-cost').value = Number(urlParams.cost || URL_DEFAULTS.cost).toLocaleString('ko-KR');
if (urlParams.residual) document.getElementById('dp-residual').value = urlParams.residual;
if (urlParams.life) document.getElementById('dp-life').value = urlParams.life;
if (urlParams.method) clickToggle('method', urlParams.method);

recalc();
