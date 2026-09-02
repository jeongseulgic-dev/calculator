function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

function parseNums(raw){
  return raw.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseFloat(s));
}

function mode(nums){
  const freq = new Map();
  nums.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));
  const maxFreq = Math.max(...freq.values());
  if (maxFreq === 1) return null;
  return [...freq.entries()].filter(([, f]) => f === maxFreq).map(([v]) => v).sort((a, b) => a - b);
}

function median(sorted){
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function recalc(){
  const raw = document.getElementById('ds-nums').value;
  const nums = parseNums(raw);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  const valid = nums.length >= 2 && nums.every(n => Number.isFinite(n));

  if (!valid){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">숫자를 쉼표(,)로 구분해 2개 이상 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const n = nums.length;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const sorted = [...nums].sort((a, b) => a - b);
  const med = median(sorted);
  const modes = mode(nums);
  const range = sorted[n - 1] - sorted[0];
  const sqDiffSum = nums.reduce((a, b) => a + (b - mean) ** 2, 0);
  const popVar = sqDiffSum / n;
  const sampleVar = n > 1 ? sqDiffSum / (n - 1) : NaN;
  const popStd = Math.sqrt(popVar);
  const sampleStd = Math.sqrt(sampleVar);

  miniScreen.textContent = fmt(mean);
  miniScreenSub.textContent = `${n}개 값의 평균`;
  meta.textContent = `n=${n}, 평균=${fmt(mean)}`;

  statBody.innerHTML = `
    <tr><th>개수 (n)</th><td>${fmt(n, 0)}</td></tr>
    <tr><th>합계</th><td>${fmt(sum)}</td></tr>
    <tr class="stat-highlight"><th>평균</th><td>${fmt(mean)}</td></tr>
    <tr><th>중앙값</th><td>${fmt(med)}</td></tr>
    <tr><th>최빈값</th><td>${modes ? modes.map(m => fmt(m)).join(', ') : '없음 (모든 값 1회)'}</td></tr>
    <tr><th>최솟값 / 최댓값</th><td>${fmt(sorted[0])} / ${fmt(sorted[n - 1])}</td></tr>
    <tr><th>범위</th><td>${fmt(range)}</td></tr>
    <tr><th>분산 (모집단)</th><td>${fmt(popVar)}</td></tr>
    <tr class="stat-highlight"><th>표준편차 (모집단)</th><td>${fmt(popStd)}</td></tr>
    <tr><th>분산 (표본)</th><td>${n > 1 ? fmt(sampleVar) : '−'}</td></tr>
    <tr class="stat-highlight"><th>표준편차 (표본)</th><td>${n > 1 ? fmt(sampleStd) : '−'}</td></tr>
  `;

  UrlState.sync({ nums: nums.join(',') }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  nums: document.getElementById('ds-nums').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.nums) document.getElementById('ds-nums').value = urlParams.nums;

document.getElementById('ds-nums').addEventListener('input', recalc);

recalc();
