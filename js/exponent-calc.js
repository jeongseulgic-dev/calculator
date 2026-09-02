function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:8 }); }

function recalc(){
  const base = parseFloat(document.getElementById('e-base').value);
  const exp = parseFloat(document.getElementById('e-exp').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(base) || !Number.isFinite(exp)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">밑과 지수를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  if (base === 0 && exp < 0){
    miniScreen.textContent = '정의되지 않음';
    miniScreenSub.textContent = '0의 음수 거듭제곱';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0을 음수 지수로 거듭제곱할 수 없습니다</td></tr>';
    meta.textContent = `${base}^${exp}`;
    return;
  }

  const result = Math.pow(base, exp);

  if (!Number.isFinite(result)){
    miniScreen.textContent = '실수 범위 아님';
    miniScreenSub.textContent = '밑이 음수 + 지수가 정수가 아님';
    statBody.innerHTML = `
      <tr><th>계산식</th><td>${base}^${exp}</td></tr>
      <tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">밑이 음수이고 지수가 정수가 아니면 실수 범위에서 계산할 수 없습니다</td></tr>
    `;
    meta.textContent = `${base}^${exp}`;
    return;
  }

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = `${base} 의 ${exp}제곱`;
  meta.textContent = `${base}^${exp}`;

  statBody.innerHTML = `
    <tr><th>계산식</th><td>${base}^${exp}</td></tr>
    <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
  `;

  UrlState.sync({ base, exp }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  base: document.getElementById('e-base').defaultValue,
  exp: document.getElementById('e-exp').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.base) document.getElementById('e-base').value = urlParams.base;
if (urlParams.exp) document.getElementById('e-exp').value = urlParams.exp;

document.querySelectorAll('#e-base, #e-exp').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
