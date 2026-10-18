let mode = 'compare';

function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }
function pct(n){ return String(Math.round(n * 10) / 10); }
function sub(t){ return `<span class="sim-sub">${t}</span>`; }
function man(n){ return (Math.round(n / 10000)).toLocaleString('ko-KR') + '만원'; }

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

  if (mode === 'guide'){
    const income = parseFloat(document.getElementById('bg-income').value.replace(/,/g, ''));
    if (!Number.isFinite(income) || income <= 0){ fail('월 소득(0보다 큼)을 입력해 주세요'); return; }
    const need = income * 0.5;
    const want = income * 0.3;
    const save = income * 0.2;
    miniScreen.textContent = fmt(save) + '원';
    miniScreenSub.textContent = '권장 저축액 (20%)';
    meta.textContent = `월 소득 ${fmt(income)}원`;
    statBody.innerHTML = `
      <tr><th>월 소득</th><td>${fmt(income)}원</td></tr>
      <tr class="stat-highlight"><th>필수 생활비 (50%)</th><td>${fmt(need)}원</td></tr>
      <tr class="stat-highlight"><th>선택 소비 (30%)</th><td>${fmt(want)}원</td></tr>
      <tr class="stat-highlight"><th>저축·투자 (20%)</th><td>${fmt(save)}원</td></tr>
    `;
    document.getElementById('nextSavings').href = `savings-calculator?savType=savings&amount=${Math.round(save)}`;
    UrlState.sync({ mode, income }, URL_DEFAULTS);
  }

  else if (mode === 'compare'){
    const income = parseFloat(document.getElementById('bg-income2').value.replace(/,/g, ''));
    const need = parseFloat(document.getElementById('bg-need').value.replace(/,/g, ''));
    const want = parseFloat(document.getElementById('bg-want').value.replace(/,/g, ''));
    const save = parseFloat(document.getElementById('bg-save').value.replace(/,/g, ''));
    if (![income, need, want, save].every(v => Number.isFinite(v)) || income <= 0){
      fail('월 소득(0보다 큼)과 지출 항목들을 입력해 주세요');
      return;
    }
    const total = need + want + save;
    const unassigned = income - total;
    const items = [
      { name: '고정·필수 지출', amount: need, target: 0.5 },
      { name: '선택 소비', amount: want, target: 0.3 },
      { name: '저축·투자', amount: save, target: 0.2 }
    ].map(it => ({ ...it, pct: it.amount / income * 100, gap: it.amount - income * it.target }));

    // 권장 배분과 가장 크게 차이 나는 항목 (1만원 미만 차이는 맞는 것으로 봄)
    const biggest = items.reduce((a, b) => Math.abs(b.gap) > Math.abs(a.gap) ? b : a);
    const matched = Math.abs(biggest.gap) < 10000;

    miniScreen.textContent = fmt(save) + '원';
    miniScreenSub.textContent = `저축 비율 ${pct(items[2].pct)}%`;
    meta.textContent = `월 소득 ${fmt(income)}원`;
    statBody.innerHTML = `
      <tr><th>월 소득</th><td>${fmt(income)}원</td></tr>
      ${items.map((it, i) => `<tr${i === 2 ? ' class="stat-highlight"' : ''}><th>${it.name}${sub(`권장 ${it.target * 100}% · ${man(income * it.target)}`)}</th><td>${fmt(it.amount)}원${sub(`소득의 ${pct(it.pct)}%`)}</td></tr>`).join('')}
      <tr><th>${unassigned < 0 ? '소득 초과 지출' : '미배정 금액'}</th><td>${fmt(Math.abs(unassigned))}원</td></tr>
      <tr><th>권장과 가장 큰 차이${sub(matched ? '세 항목 모두' : biggest.name)}</th><td>${matched ? '거의 같음' : `${biggest.gap > 0 ? '+' : '−'}${fmt(Math.abs(biggest.gap))}원`}${matched ? '' : sub(biggest.gap > 0 ? '권장보다 많음' : '권장보다 적음')}</td></tr>
    `;
    document.getElementById('nextSavings').href = `savings-calculator?savType=savings&amount=${Math.round(save)}`;
    UrlState.sync({ mode, income2: income, need, want, save }, URL_DEFAULTS);
  }
}

document.getElementById('bg-income').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('bg-income2').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('bg-need').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('bg-want').addEventListener('input', function(){ formatInputComma(this); recalc(); });
document.getElementById('bg-save').addEventListener('input', function(){ formatInputComma(this); recalc(); });

const URL_DEFAULTS = {
  mode: 'compare',
  income: '3000000',
  income2: '3000000',
  need: '1500000',
  want: '900000',
  save: '600000'
};

const urlParams = UrlState.read();
document.getElementById('bg-income').value = Number(urlParams.income || URL_DEFAULTS.income).toLocaleString('ko-KR');
document.getElementById('bg-income2').value = Number(urlParams.income2 || URL_DEFAULTS.income2).toLocaleString('ko-KR');
document.getElementById('bg-need').value = Number(urlParams.need || URL_DEFAULTS.need).toLocaleString('ko-KR');
document.getElementById('bg-want').value = Number(urlParams.want || URL_DEFAULTS.want).toLocaleString('ko-KR');
document.getElementById('bg-save').value = Number(urlParams.save || URL_DEFAULTS.save).toLocaleString('ko-KR');
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
