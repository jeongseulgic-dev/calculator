const Z_TABLE = { '80':1.282, '85':1.440, '90':1.645, '95':1.960, '98':2.326, '99':2.576, '99.9':3.291 };

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

function recalc(){
  const n = parseFloat(document.getElementById('ci-n').value);
  const mean = parseFloat(document.getElementById('ci-mean').value);
  const std = parseFloat(document.getElementById('ci-std').value);
  const level = document.getElementById('ci-level').value;

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(n) || !Number.isFinite(mean) || !Number.isFinite(std) || n <= 0 || std < 0){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">표본크기(0보다 큼), 표본평균, 표준편차(0 이상)를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const z = Z_TABLE[level];
  const marginOfError = z * std / Math.sqrt(n);
  const lower = mean - marginOfError;
  const upper = mean + marginOfError;

  miniScreen.textContent = `${fmt(lower)} ~ ${fmt(upper)}`;
  miniScreenSub.textContent = `신뢰수준 ${level}%`;
  meta.textContent = `n=${n}, 평균=${mean}, s=${std}, ${level}%`;

  statBody.innerHTML = `
    <tr><th>표본크기 (n)</th><td>${fmt(n, 0)}</td></tr>
    <tr><th>표본평균 (x̄)</th><td>${fmt(mean)}</td></tr>
    <tr><th>표준편차 (s)</th><td>${fmt(std)}</td></tr>
    <tr><th>신뢰수준 / Z값</th><td>${level}% (Z=${z})</td></tr>
    <tr class="stat-highlight"><th>오차범위 (±)</th><td>${fmt(marginOfError)}</td></tr>
    <tr class="stat-highlight"><th>신뢰구간</th><td>[${fmt(lower)}, ${fmt(upper)}]</td></tr>
  `;

  UrlState.sync({ n, mean, std, level }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  n: document.getElementById('ci-n').defaultValue,
  mean: document.getElementById('ci-mean').defaultValue,
  std: document.getElementById('ci-std').defaultValue,
  level: document.getElementById('ci-level').value
};

const urlParams = UrlState.read();
if (urlParams.n) document.getElementById('ci-n').value = urlParams.n;
if (urlParams.mean) document.getElementById('ci-mean').value = urlParams.mean;
if (urlParams.std) document.getElementById('ci-std').value = urlParams.std;
if (urlParams.level) document.getElementById('ci-level').value = urlParams.level;

document.querySelectorAll('#ci-n, #ci-mean, #ci-std').forEach(el=>{
  el.addEventListener('input', recalc);
});
document.getElementById('ci-level').addEventListener('change', recalc);

recalc();
