function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:8 }); }

function nthRoot(x, n){
  if (x < 0){
    if (n % 2 === 0) return NaN;
    return -Math.pow(-x, 1/n);
  }
  return Math.pow(x, 1/n);
}

function recalc(){
  const x = parseFloat(document.getElementById('r-x').value);
  const n = parseFloat(document.getElementById('r-n').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(x) || !Number.isFinite(n) || n === 0){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">진수와 0이 아닌 차수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const result = nthRoot(x, n);
  const rootName = n === 2 ? '제곱근' : n === 3 ? '세제곱근' : `${n}제곱근`;

  if (!Number.isFinite(result)){
    miniScreen.textContent = '실수 범위 아님';
    miniScreenSub.textContent = '음수의 짝수제곱근';
    statBody.innerHTML = `
      <tr><th>계산식</th><td>${x}의 ${rootName}</td></tr>
      <tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">음수의 짝수제곱근은 실수 범위에서 존재하지 않습니다</td></tr>
    `;
    meta.textContent = `${x}의 ${n}제곱근`;
    return;
  }

  const verify = n === Math.round(n) ? Math.pow(result, n) : null;

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = `${x}의 ${rootName}`;
  meta.textContent = `${x}의 ${n}제곱근`;

  statBody.innerHTML = `
    <tr><th>계산식</th><td>${x}의 ${rootName} (n=${n})</td></tr>
    <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
    ${verify !== null ? `<tr><th>검산</th><td>${fmt(result)}^${n} ≈ ${fmt(verify)}</td></tr>` : ''}
  `;

  UrlState.sync({ x, n }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  x: document.getElementById('r-x').defaultValue,
  n: document.getElementById('r-n').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('r-x').value = urlParams.x;
if (urlParams.n) document.getElementById('r-n').value = urlParams.n;

document.querySelectorAll('#r-x, #r-n').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
