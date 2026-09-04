let mode = 'compare';

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
    const needPct = need / income * 100;
    const wantPct = want / income * 100;
    const savePct = save / income * 100;
    const unassigned = income - total;

    miniScreen.textContent = fmt(save) + '원';
    miniScreenSub.textContent = `저축 비율 ${savePct.toFixed(1)}%`;
    meta.textContent = `월 소득 ${fmt(income)}원`;
    statBody.innerHTML = `
      <tr><th>월 소득</th><td>${fmt(income)}원</td></tr>
      <tr><th>고정·필수 지출</th><td>${fmt(need)}원 (${needPct.toFixed(1)}%, 권장 50%)</td></tr>
      <tr><th>선택 소비</th><td>${fmt(want)}원 (${wantPct.toFixed(1)}%, 권장 30%)</td></tr>
      <tr class="stat-highlight"><th>저축·투자</th><td>${fmt(save)}원 (${savePct.toFixed(1)}%, 권장 20%)</td></tr>
      <tr><th>미배정 금액</th><td>${fmt(unassigned)}원</td></tr>
    `;
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
