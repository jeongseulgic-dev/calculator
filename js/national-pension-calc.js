function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function recalc(){
  const aValue = parseFloat(document.getElementById('np-a').value.replace(/,/g, ''));
  const bValue = parseFloat(document.getElementById('np-b').value.replace(/,/g, ''));
  const years = parseFloat(document.getElementById('np-years').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(aValue) || aValue <= 0 || !Number.isFinite(bValue) || bValue <= 0 || !Number.isFinite(years) || years <= 0){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">A값·본인 평균소득월액·가입기간(모두 0보다 큼)을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const months = years * 12;
  const excessMonths = Math.max(0, months - 240);
  const basicPension = (1.29 / 12) * (aValue + bValue) * (1 + 0.05 * excessMonths / 12);
  const under10y = years < 10;

  miniScreen.textContent = fmt(basicPension) + '원';
  miniScreenSub.textContent = '예상 월 연금액(근사치)';
  meta.textContent = `A값 ${fmt(aValue)}원 · B값 ${fmt(bValue)}원 · ${years}년 가입`;

  statBody.innerHTML = `
    <tr><th>A값 (전체가입자 평균소득)</th><td>${fmt(aValue)}원</td></tr>
    <tr><th>B값 (본인 평균소득월액)</th><td>${fmt(bValue)}원</td></tr>
    <tr><th>가입기간</th><td>${years}년 (${fmt(months)}개월)</td></tr>
    <tr class="stat-highlight"><th>예상 월 연금액(근사치)</th><td>${fmt(basicPension)}원</td></tr>
    ${under10y ? '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">가입기간이 10년(120개월) 미만이면 노령연금이 아닌 반환일시금 대상이 될 수 있습니다</td></tr>' : ''}
  `;

  UrlState.sync({ a: aValue, b: bValue, years }, URL_DEFAULTS);
}

document.getElementById('np-a').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('np-b').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('np-years').addEventListener('input', recalc);

const URL_DEFAULTS = { a: '3193511', b: '1000000', years: document.getElementById('np-years').defaultValue };

const urlParams = UrlState.read();
document.getElementById('np-a').value = Number(urlParams.a || URL_DEFAULTS.a).toLocaleString('ko-KR');
document.getElementById('np-b').value = Number(urlParams.b || URL_DEFAULTS.b).toLocaleString('ko-KR');
if (urlParams.years) document.getElementById('np-years').value = urlParams.years;

recalc();
