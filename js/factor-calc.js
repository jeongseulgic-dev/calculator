function fmt(n){ return n.toLocaleString('ko-KR'); }

function primeFactorize(n){
  const factors = {};
  let d = 2;
  while (d * d <= n){
    while (n % d === 0){
      factors[d] = (factors[d] || 0) + 1;
      n /= d;
    }
    d++;
  }
  if (n > 1) factors[n] = (factors[n] || 0) + 1;
  return factors;
}

function allDivisors(n){
  const divs = [];
  for (let i = 1; i * i <= n; i++){
    if (n % i === 0){
      divs.push(i);
      if (i !== n / i) divs.push(n / i);
    }
  }
  return divs.sort((a, b) => a - b);
}

function recalc(){
  const raw = document.getElementById('fc-n').value;
  const n = parseInt(raw, 10);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(n) || n < 1 || n > 100000000){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">1 이상 1억 이하의 자연수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const divisors = allDivisors(n);
  const factors = n === 1 ? {} : primeFactorize(n);
  const factorStr = Object.keys(factors).length
    ? Object.entries(factors).map(([p, e]) => e > 1 ? `${p}<sup>${e}</sup>` : p).join(' × ')
    : '소인수 없음 (1)';
  const isPrime = n > 1 && divisors.length === 2;

  miniScreen.textContent = fmt(divisors.length);
  miniScreenSub.textContent = `${fmt(n)}의 약수 개수`;
  meta.textContent = `N = ${fmt(n)}`;

  statBody.innerHTML = `
    <tr><th>입력한 수</th><td>${fmt(n)}</td></tr>
    <tr><th>소인수분해</th><td>${factorStr}</td></tr>
    <tr><th>소수 여부</th><td>${isPrime ? '소수' : n === 1 ? '소수도 합성수도 아님' : '합성수'}</td></tr>
    <tr class="stat-highlight"><th>약수 (${divisors.length}개)</th><td>${divisors.map(fmt).join(', ')}</td></tr>
  `;

  UrlState.sync({ n }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  n: document.getElementById('fc-n').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.n) document.getElementById('fc-n').value = urlParams.n;

document.getElementById('fc-n').addEventListener('input', recalc);

recalc();
