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
    document.getElementById('nextSalary').href = 'salary-calculator';
    return;
  }

  const months = years * 12;
  const excessMonths = Math.max(0, months - 240);
  // 기본연금액(국민연금법 §51): 1.29 × (A + B) × (1 + 0.05 × 20년 초과월수 ÷ 12), 연액이라 12로 나눠 월액
  const basicPension = (1.29 / 12) * (aValue + bValue) * (1 + 0.05 * excessMonths / 12);
  // 지급률(§63①): 20년 이상 100%, 10~20년은 50%에 10년 초과 1개월마다 5/12%씩 더함
  const payRate = months >= 240 ? 1 : 0.5 + 0.05 * (months - 120) / 12;
  const pension = basicPension * payRate;

  meta.textContent = `A값 ${fmt(aValue)}원 · B값 ${fmt(bValue)}원 · ${years}년 가입`;

  if (months < 120){
    miniScreen.textContent = '반환일시금 대상';
    miniScreenSub.textContent = '가입기간 10년 미만';
    statBody.innerHTML = `
      <tr><th>가입기간</th><td>${years}년 (${fmt(months)}개월)</td></tr>
      <tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">노령연금은 가입기간 10년(120개월) 이상부터 받습니다. 10년 미만이면 낸 보험료에 이자를 더한 반환일시금 대상입니다(임의계속가입으로 10년을 채우면 연금으로 받을 수 있습니다).</td></tr>
    `;
    document.getElementById('nextSalary').href = `salary-calculator?salary=${Math.round(bValue * 12)}`;
    UrlState.sync({ a: aValue, b: bValue, years }, URL_DEFAULTS);
    return;
  }

  miniScreen.textContent = fmt(pension) + '원';
  miniScreenSub.textContent = '예상 월 연금액(근사치)';

  statBody.innerHTML = `
    <tr><th>A값 (전체가입자 평균소득)</th><td>${fmt(aValue)}원</td></tr>
    <tr><th>B값 (본인 평균소득월액)</th><td>${fmt(bValue)}원</td></tr>
    <tr><th>가입기간</th><td>${years}년 (${fmt(months)}개월)</td></tr>
    <tr><th>기본연금액(월)</th><td>${fmt(basicPension)}원</td></tr>
    <tr><th>지급률</th><td>${+(payRate * 100).toFixed(2)}%</td></tr>
    <tr class="stat-highlight"><th>예상 월 연금액(근사치)</th><td>${fmt(pension)}원</td></tr>
    ${bValue > 6590000 ? '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">기준소득월액 상한이 659만원(2026년 7월~)이라 B값이 이보다 크게 나오기는 어렵습니다</td></tr>' : ''}
  `;

  document.getElementById('nextSalary').href = `salary-calculator?salary=${Math.round(bValue * 12)}`;

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
