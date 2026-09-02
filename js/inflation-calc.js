function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function recalc(){
  const amount = parseFloat(document.getElementById('infl-amount').value.replace(/,/g, ''));
  const rate = parseFloat(document.getElementById('infl-rate').value);
  const years = parseFloat(document.getElementById('infl-years').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(rate) || !Number.isFinite(years) || years < 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">기준금액(0 이상), 상승률, 연수(0 이상)를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const factor = Math.pow(1 + rate / 100, years);
  const result = amount * factor;
  const changePct = (factor - 1) * 100;

  miniScreen.textContent = fmt(result) + '원';
  miniScreenSub.textContent = `${years}년 후 화폐가치 기준`;
  meta.textContent = `${fmt(amount)}원 · 연 ${rate}% · ${years}년`;

  statBody.innerHTML = `
    <tr><th>기준금액</th><td>${fmt(amount)}원</td></tr>
    <tr><th>연평균 물가상승률</th><td>${rate}%</td></tr>
    <tr><th>경과 연수</th><td>${years}년</td></tr>
    <tr class="stat-highlight"><th>환산 금액</th><td>${fmt(result)}원</td></tr>
    <tr><th>누적 변동률</th><td>${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%</td></tr>
  `;

  UrlState.sync({ amount, rate, years }, URL_DEFAULTS);
}

document.getElementById('infl-amount').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('infl-rate').addEventListener('input', recalc);
document.getElementById('infl-years').addEventListener('input', recalc);

const URL_DEFAULTS = { amount: '1000000', rate: document.getElementById('infl-rate').defaultValue, years: document.getElementById('infl-years').defaultValue };

const urlParams = UrlState.read();
document.getElementById('infl-amount').value = Number(urlParams.amount || URL_DEFAULTS.amount).toLocaleString('ko-KR');
if (urlParams.rate) document.getElementById('infl-rate').value = urlParams.rate;
if (urlParams.years) document.getElementById('infl-years').value = urlParams.years;

recalc();
