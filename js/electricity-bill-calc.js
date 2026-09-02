let season = 'other';

const RATES = [120.0, 214.6, 307.3];
const BASIC = [910, 1600, 7300];
const BOUNDS = { other: [200, 400], summer: [300, 450] };

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle[data-target="season"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="season"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    season = btn.dataset.value;
    recalc();
  });
});

function calcBill(usage, seasonKey){
  const [b1, b2] = BOUNDS[seasonKey];
  const tier = usage <= b1 ? 0 : usage <= b2 ? 1 : 2;
  const basic = BASIC[tier];

  const tierBounds = [b1, b2, Infinity];
  let energyCharge = 0;
  let remaining = usage;
  let prevBound = 0;
  for (let i = 0; i < 3; i++){
    const tierCap = tierBounds[i] - prevBound;
    const tierUsage = Math.min(remaining, tierCap);
    if (tierUsage <= 0) break;
    energyCharge += tierUsage * RATES[i];
    remaining -= tierUsage;
    prevBound = tierBounds[i];
    if (remaining <= 0) break;
  }

  const subtotal = basic + energyCharge;
  const vat = Math.round(subtotal * 0.1);
  const fund = Math.floor(subtotal * 0.037 / 10) * 10;
  const total = Math.floor((subtotal + vat + fund) / 10) * 10;

  return { tier, basic, energyCharge, subtotal, vat, fund, total };
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '0원';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const usage = parseFloat(document.getElementById('eb-usage').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(usage) || usage < 0){
    fail('사용량(0 이상, kWh)을 입력해 주세요');
    return;
  }

  const r = calcBill(usage, season);
  const seasonLabel = season === 'summer' ? '하계(7~8월)' : '기타계절(1~6월,9~12월)';
  const tierLabel = ['1단계', '2단계', '3단계'][r.tier];

  miniScreen.textContent = fmt(r.total) + '원';
  miniScreenSub.textContent = `${tierLabel} · ${seasonLabel}`;
  meta.textContent = `${usage}kWh · ${seasonLabel}`;

  statBody.innerHTML = `
    <tr><th>사용량</th><td>${fmt(usage)}kWh (${tierLabel})</td></tr>
    <tr><th>기본요금</th><td>${fmt(r.basic)}원</td></tr>
    <tr><th>전력량요금</th><td>${fmt(r.energyCharge)}원</td></tr>
    <tr><th>전기요금계</th><td>${fmt(r.subtotal)}원</td></tr>
    <tr><th>부가가치세(10%)</th><td>${fmt(r.vat)}원</td></tr>
    <tr><th>전력산업기반기금(3.7%)</th><td>${fmt(r.fund)}원</td></tr>
    <tr class="stat-highlight"><th>청구금액(추정)</th><td>${fmt(r.total)}원</td></tr>
  `;

  UrlState.sync({ season, usage }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  season: 'other',
  usage: document.getElementById('eb-usage').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.usage) document.getElementById('eb-usage').value = urlParams.usage;
if (urlParams.season) clickToggle('season', urlParams.season);

document.getElementById('eb-usage').addEventListener('input', recalc);

recalc();
