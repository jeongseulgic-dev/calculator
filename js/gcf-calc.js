function fmt(n){ return n.toLocaleString('ko-KR'); }

function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a || 1; }

function parseNums(raw){
  return raw.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => parseInt(s, 10));
}

function recalc(){
  const raw = document.getElementById('gc-nums').value;
  const nums = parseNums(raw);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  const valid = nums.length >= 2 && nums.every(n => Number.isFinite(n) && n > 0);

  if (!valid){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">양의 정수를 쉼표(,)로 구분해 2개 이상 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const result = nums.reduce((acc, n) => gcd(acc, n));

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = `${nums.join(', ')}의 최대공약수`;
  meta.textContent = nums.join(', ');

  statBody.innerHTML = `
    <tr><th>입력한 수</th><td>${nums.join(', ')}</td></tr>
    <tr class="stat-highlight"><th>최대공약수 (GCF)</th><td>${fmt(result)}</td></tr>
    <tr><th>서로소 여부</th><td>${result === 1 ? '서로소 (공약수 1뿐)' : '아님'}</td></tr>
  `;

  UrlState.sync({ nums: nums.join(',') }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  nums: document.getElementById('gc-nums').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.nums) document.getElementById('gc-nums').value = urlParams.nums;

document.getElementById('gc-nums').addEventListener('input', recalc);

recalc();
