function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:4 }); }

function recalc(){
  const trueVal = parseFloat(document.getElementById('pe-true').value);
  const obsVal = parseFloat(document.getElementById('pe-obs').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(trueVal) || !Number.isFinite(obsVal) || trueVal === 0){
    miniScreen.textContent = '0%';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">실제값(0이 아닌)과 측정값을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const diff = obsVal - trueVal;
  const error = Math.abs(diff) / Math.abs(trueVal) * 100;
  const sign = diff >= 0 ? '+' : '−';

  miniScreen.textContent = fmt(error) + '%';
  miniScreenSub.textContent = `측정값이 실제값보다 ${diff >= 0 ? '높음' : '낮음'}`;
  meta.textContent = `실제값 ${fmt(trueVal)} · 측정값 ${fmt(obsVal)}`;

  statBody.innerHTML = `
    <tr><th>실제값(참값)</th><td>${fmt(trueVal)}</td></tr>
    <tr><th>측정값</th><td>${fmt(obsVal)}</td></tr>
    <tr><th>차이</th><td>${sign}${fmt(Math.abs(diff))}</td></tr>
    <tr class="stat-highlight"><th>오차백분율</th><td>${fmt(error)}%</td></tr>
  `;

  UrlState.sync({ trueVal, obsVal }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  trueVal: document.getElementById('pe-true').defaultValue,
  obsVal: document.getElementById('pe-obs').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.trueVal) document.getElementById('pe-true').value = urlParams.trueVal;
if (urlParams.obsVal) document.getElementById('pe-obs').value = urlParams.obsVal;

document.querySelectorAll('#pe-true, #pe-obs').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
