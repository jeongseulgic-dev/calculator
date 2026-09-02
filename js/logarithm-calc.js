function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:8 }); }

function recalc(){
  const x = parseFloat(document.getElementById('l-x').value);
  const base = parseFloat(document.getElementById('l-base').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(x) || !Number.isFinite(base) || x <= 0 || base <= 0 || base === 1){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">진수는 0보다 큰 수, 밑은 1이 아닌 양수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const result = Math.log(x) / Math.log(base);
  const baseLabel = Math.abs(base - Math.E) < 1e-9 ? 'e (자연로그)' : base;

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = `log base ${baseLabel} 의 ${x}`;
  meta.textContent = `log_${base}(${x})`;

  statBody.innerHTML = `
    <tr><th>계산식</th><td>log<sub>${baseLabel}</sub>(${x})</td></tr>
    <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
    <tr><th>검산</th><td>${baseLabel}^${fmt(result)} ≈ ${fmt(Math.pow(base, result))}</td></tr>
  `;

  UrlState.sync({ x, base }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  x: document.getElementById('l-x').defaultValue,
  base: document.getElementById('l-base').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.x) document.getElementById('l-x').value = urlParams.x;
if (urlParams.base) document.getElementById('l-base').value = urlParams.base;

document.querySelectorAll('#l-x, #l-base').forEach(el=>{
  el.addEventListener('input', recalc);
});

document.getElementById('l-base-e').addEventListener('click', ()=>{
  document.getElementById('l-base').value = Math.E;
  recalc();
});

recalc();
