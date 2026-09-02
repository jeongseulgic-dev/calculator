let op = '+';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:6 }); }

function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b){ [a, b] = [b, a % b]; } return a || 1; }

function calcFraction(n1, d1, n2, d2, operator){
  let n, d;
  if (operator === '+'){ n = n1*d2 + n2*d1; d = d1*d2; }
  else if (operator === '-'){ n = n1*d2 - n2*d1; d = d1*d2; }
  else if (operator === '×'){ n = n1*n2; d = d1*d2; }
  else { n = n1*d2; d = d1*n2; }
  if (d < 0){ n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n/g, d: d/g };
}

function mixedStr(n, d){
  const whole = Math.trunc(n/d);
  const rem = Math.abs(n % d);
  if (whole === 0 || rem === 0) return null;
  return `${whole} ${rem}/${d}`;
}

document.querySelectorAll('.seg-toggle[data-target="op"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="op"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    op = btn.dataset.value;
    recalc();
  });
});

function recalc(){
  const n1 = parseInt(document.getElementById('f-n1').value, 10);
  const d1 = parseInt(document.getElementById('f-d1').value, 10);
  const n2 = parseInt(document.getElementById('f-n2').value, 10);
  const d2 = parseInt(document.getElementById('f-d2').value, 10);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(n1) || !Number.isFinite(d1) || !Number.isFinite(n2) || !Number.isFinite(d2) || d1 === 0 || d2 === 0 || (op === '÷' && n2 === 0)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">분모가 0이 아닌 값을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const { n, d } = calcFraction(n1, d1, n2, d2, op);
  const mixed = mixedStr(n, d);
  const decimal = n / d;

  miniScreen.textContent = `${n}/${d}`;
  miniScreenSub.textContent = mixed ? `대분수 ${mixed}` : '';
  meta.textContent = `${n1}/${d1} ${op} ${n2}/${d2}`;

  statBody.innerHTML = `
    <tr><th>계산식</th><td>${n1}/${d1} ${op} ${n2}/${d2}</td></tr>
    <tr class="stat-highlight"><th>기약분수</th><td>${n}/${d}</td></tr>
    ${mixed ? `<tr><th>대분수</th><td>${mixed}</td></tr>` : ''}
    <tr><th>소수</th><td>${fmt(decimal)}</td></tr>
  `;

  UrlState.sync({ n1, d1, n2, d2, op }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  n1: document.getElementById('f-n1').defaultValue,
  d1: document.getElementById('f-d1').defaultValue,
  n2: document.getElementById('f-n2').defaultValue,
  d2: document.getElementById('f-d2').defaultValue,
  op: toggleDefault('op')
};

const urlParams = UrlState.read();
['n1','d1','n2','d2'].forEach(k=>{
  const el = document.getElementById('f-' + k);
  if (urlParams[k] && el) el.value = urlParams[k];
});
if (urlParams.op) clickToggle('op', urlParams.op);

document.querySelectorAll('#f-n1, #f-d1, #f-n2, #f-d2').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
