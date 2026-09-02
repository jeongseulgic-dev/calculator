function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:0 }); }

function nPr(n, r){
  let result = 1;
  for (let i = 0; i < r; i++) result *= (n - i);
  return result;
}

function nCr(n, r){
  let result = 1;
  for (let i = 0; i < r; i++) result = result * (n - i) / (i + 1);
  return Math.round(result);
}

function recalc(){
  const n = parseInt(document.getElementById('pc-n').value, 10);
  const r = parseInt(document.getElementById('pc-r').value, 10);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(n) || !Number.isFinite(r) || n < 0 || r < 0 || r > n || n > 170){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0 ≤ r ≤ n ≤ 170을 만족하는 정수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const perm = nPr(n, r);
  const comb = nCr(n, r);

  miniScreen.textContent = fmt(comb);
  miniScreenSub.textContent = `${n}C${r} (조합)`;
  meta.textContent = `n=${n}, r=${r}`;

  statBody.innerHTML = `
    <tr><th>전체 집합 크기 (n)</th><td>${fmt(n)}</td></tr>
    <tr><th>선택 개수 (r)</th><td>${fmt(r)}</td></tr>
    <tr class="stat-highlight"><th>순열 (nPr, 순서 O)</th><td>${fmt(perm)}</td></tr>
    <tr class="stat-highlight"><th>조합 (nCr, 순서 X)</th><td>${fmt(comb)}</td></tr>
  `;

  UrlState.sync({ n, r }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  n: document.getElementById('pc-n').defaultValue,
  r: document.getElementById('pc-r').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.n) document.getElementById('pc-n').value = urlParams.n;
if (urlParams.r) document.getElementById('pc-r').value = urlParams.r;

document.querySelectorAll('#pc-n, #pc-r').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
