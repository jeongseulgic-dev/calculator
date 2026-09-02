let mode = 'result';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:8 }); }

function nthRoot(x, n){
  if (x < 0){
    if (n % 2 === 0) return NaN;
    return -Math.pow(-x, 1/n);
  }
  return Math.pow(x, 1/n);
}

document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      const modes = f.dataset.mode.split(',');
      f.classList.toggle('hidden', !modes.includes(mode));
    });
    recalc();
  });
});

function fail(msg){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');
  miniScreen.textContent = '0';
  miniScreenSub.textContent = '';
  statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  meta.textContent = '--';
}

function recalc(){
  const base = parseFloat(document.getElementById('e-base').value);
  const exp = parseFloat(document.getElementById('e-exp').value);
  const result = parseFloat(document.getElementById('e-result').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'result'){
    if (!Number.isFinite(base) || !Number.isFinite(exp)){
      fail('밑과 지수를 입력해 주세요');
      return;
    }
    if (base === 0 && exp < 0){
      fail('0을 음수 지수로 거듭제곱할 수 없습니다');
      meta.textContent = `${base}^${exp}`;
      return;
    }
    const r = Math.pow(base, exp);
    if (!Number.isFinite(r)){
      fail('밑이 음수이고 지수가 정수가 아니면 실수 범위에서 계산할 수 없습니다');
      meta.textContent = `${base}^${exp}`;
      return;
    }
    miniScreen.textContent = fmt(r);
    miniScreenSub.textContent = `${base} 의 ${exp}제곱`;
    meta.textContent = `${base}^${exp} = ?`;
    statBody.innerHTML = `
      <tr><th>계산식</th><td>${base}^${exp}</td></tr>
      <tr class="stat-highlight"><th>결과값</th><td>${fmt(r)}</td></tr>
    `;
    UrlState.sync({ mode, base, exp }, URL_DEFAULTS);
  }

  else if (mode === 'base'){
    if (!Number.isFinite(exp) || !Number.isFinite(result)){
      fail('지수와 결과값을 입력해 주세요');
      return;
    }
    if (exp === 0){
      fail('지수가 0이면 밑을 하나로 정할 수 없습니다 (0이 아닌 모든 밑의 0제곱은 1)');
      meta.textContent = `?^${exp} = ${result}`;
      return;
    }
    const b = nthRoot(result, exp);
    if (!Number.isFinite(b)){
      fail('결과값이 음수이고 지수가 짝수이면 실수 범위에서 밑을 구할 수 없습니다');
      meta.textContent = `?^${exp} = ${result}`;
      return;
    }
    miniScreen.textContent = fmt(b);
    miniScreenSub.textContent = `${result}의 ${exp}제곱근`;
    meta.textContent = `?^${exp} = ${result}`;
    statBody.innerHTML = `
      <tr><th>방정식</th><td>x^${exp} = ${result}</td></tr>
      <tr class="stat-highlight"><th>밑 (x)</th><td>${fmt(b)}</td></tr>
    `;
    UrlState.sync({ mode, exp, result }, URL_DEFAULTS);
  }

  else if (mode === 'exp'){
    if (!Number.isFinite(base) || !Number.isFinite(result) || base <= 0 || base === 1 || result <= 0){
      fail('밑(1이 아닌 양수)과 결과값(양수)을 입력해 주세요');
      return;
    }
    const e = Math.log(result) / Math.log(base);
    miniScreen.textContent = fmt(e);
    miniScreenSub.textContent = `${base}를 몇 제곱하면 ${result}`;
    meta.textContent = `${base}^? = ${result}`;
    statBody.innerHTML = `
      <tr><th>방정식</th><td>${base}^x = ${result}</td></tr>
      <tr class="stat-highlight"><th>지수 (x)</th><td>${fmt(e)}</td></tr>
    `;
    UrlState.sync({ mode, base, result }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('solve'),
  base: document.getElementById('e-base').defaultValue,
  exp: document.getElementById('e-exp').defaultValue,
  result: document.getElementById('e-result').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.base) document.getElementById('e-base').value = urlParams.base;
if (urlParams.exp) document.getElementById('e-exp').value = urlParams.exp;
if (urlParams.result) document.getElementById('e-result').value = urlParams.result;
if (urlParams.mode) clickToggle('solve', urlParams.mode);

document.querySelectorAll('#e-base, #e-exp, #e-result').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
