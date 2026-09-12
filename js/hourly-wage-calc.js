function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle[data-target="size"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="size"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
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
  const wage = parseFloat(document.getElementById('hw-wage').value.replace(/,/g, ''));
  const dailyHours = parseFloat(document.getElementById('hw-daily').value);
  const daysPerWeek = parseFloat(document.getElementById('hw-days').value);
  const otHours = parseFloat(document.getElementById('hw-ot').value) || 0;
  const over5 = toggleDefault('size') === 'over5';

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(wage) || wage <= 0 || !Number.isFinite(dailyHours) || dailyHours <= 0 || dailyHours > 24 ||
      !Number.isFinite(daysPerWeek) || daysPerWeek <= 0 || daysPerWeek > 7 || otHours < 0){
    fail('시급(0보다 큼), 1일 근무시간(0~24), 주 근무일수(0~7)를 입력해 주세요');
    return;
  }

  const weeklyReg = dailyHours * daysPerWeek;
  const eligible = weeklyReg >= 15;
  const holidayHours = eligible ? Math.min(1, weeklyReg / 40) * 8 : 0;
  const holidayPay = holidayHours * wage;
  const basePay = wage * weeklyReg;
  const otRate = over5 ? 1.5 : 1.0;
  const otPay = otHours * wage * otRate;
  const weeklyTotal = basePay + holidayPay + otPay;

  const monthlyHours = Math.round((weeklyReg + holidayHours) * 365 / 7 / 12);
  const monthlyBase = monthlyHours * wage;
  const monthlyOtHours = Math.round(otHours * 365 / 7 / 12);
  const monthlyOt = monthlyOtHours * wage * otRate;
  const monthlyTotal = monthlyBase + monthlyOt;

  miniScreen.textContent = fmt(monthlyTotal) + '원';
  miniScreenSub.textContent = '월급 합계(세전, 추정)';
  meta.textContent = `시급 ${fmt(wage)}원 · 주 ${fmt(weeklyReg)}시간 · ${eligible ? '주휴수당 대상' : '주휴수당 미대상'}`;

  statBody.innerHTML = `
    <tr><th>주 소정근로시간</th><td>${fmt(weeklyReg)}시간</td></tr>
    <tr><th>주휴수당 지급 대상</th><td>${eligible ? '대상 (15시간 이상)' : '미대상 (15시간 미만)'}</td></tr>
    <tr><th>기본급(주)</th><td>${fmt(basePay)}원</td></tr>
    <tr><th>주휴수당</th><td>${fmt(holidayPay)}원</td></tr>
    <tr><th>연장근로수당(주)</th><td>${fmt(otPay)}원 ${otHours > 0 ? `(${over5 ? '50%' : '가산 없음'} 적용)` : ''}</td></tr>
    <tr class="stat-highlight"><th>주급 합계</th><td>${fmt(weeklyTotal)}원</td></tr>
    <tr><th>월 환산 소정근로시간</th><td>${monthlyHours}시간</td></tr>
    <tr><th>월급(기본+주휴수당)</th><td>${fmt(monthlyBase)}원</td></tr>
    <tr><th>월 연장근로수당(환산)</th><td>${fmt(monthlyOt)}원</td></tr>
    <tr class="stat-highlight"><th>월급 합계(세전, 추정)</th><td>${fmt(monthlyTotal)}원</td></tr>
  `;

  UrlState.sync({ wage, daily: dailyHours, days: daysPerWeek, ot: otHours, size: over5 ? 'over5' : 'under5' }, URL_DEFAULTS);
}

document.getElementById('hw-wage').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('hw-daily').addEventListener('input', recalc);
document.getElementById('hw-days').addEventListener('input', recalc);
document.getElementById('hw-ot').addEventListener('input', recalc);

const URL_DEFAULTS = {
  wage: '10320',
  daily: document.getElementById('hw-daily').defaultValue,
  days: document.getElementById('hw-days').defaultValue,
  ot: document.getElementById('hw-ot').defaultValue,
  size: toggleDefault('size')
};

document.getElementById('hw-wage').value = Number(URL_DEFAULTS.wage).toLocaleString('ko-KR');

const urlParams = UrlState.read();
if (urlParams.wage) document.getElementById('hw-wage').value = Number(urlParams.wage).toLocaleString('ko-KR');
if (urlParams.daily) document.getElementById('hw-daily').value = urlParams.daily;
if (urlParams.days) document.getElementById('hw-days').value = urlParams.days;
if (urlParams.ot) document.getElementById('hw-ot').value = urlParams.ot;
if (urlParams.size) clickToggle('size', urlParams.size);

recalc();
