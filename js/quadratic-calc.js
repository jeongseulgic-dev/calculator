function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:6 }); }

function recalc(){
  const a = parseFloat(document.getElementById('q-a').value);
  const b = parseFloat(document.getElementById('q-b').value);
  const c = parseFloat(document.getElementById('q-c').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">a, b, c를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  if (a === 0){
    miniScreen.textContent = '이차방정식 아님';
    miniScreenSub.textContent = 'a는 0이 될 수 없습니다';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">a가 0이면 이차항이 사라져 이차방정식이 아닙니다</td></tr>';
    meta.textContent = `${a}x² + ${b}x + ${c} = 0`;
    return;
  }

  const D = b*b - 4*a*c;
  meta.textContent = `${a}x² + ${b}x + ${c} = 0`;

  if (D > 0){
    const x1 = (-b + Math.sqrt(D)) / (2*a);
    const x2 = (-b - Math.sqrt(D)) / (2*a);
    miniScreen.textContent = `x = ${fmt(x1)} 또는 ${fmt(x2)}`;
    miniScreenSub.textContent = '서로 다른 두 실근';
    statBody.innerHTML = `
      <tr><th>방정식</th><td>${a}x² + ${b}x + ${c} = 0</td></tr>
      <tr><th>판별식 (D)</th><td>${fmt(D)} (D &gt; 0, 실근 2개)</td></tr>
      <tr class="stat-highlight"><th>근 1</th><td>x₁ = ${fmt(x1)}</td></tr>
      <tr class="stat-highlight"><th>근 2</th><td>x₂ = ${fmt(x2)}</td></tr>
    `;
  } else if (D === 0){
    const x = -b / (2*a);
    miniScreen.textContent = `x = ${fmt(x)}`;
    miniScreenSub.textContent = '중근 (실근 1개)';
    statBody.innerHTML = `
      <tr><th>방정식</th><td>${a}x² + ${b}x + ${c} = 0</td></tr>
      <tr><th>판별식 (D)</th><td>0 (중근)</td></tr>
      <tr class="stat-highlight"><th>근 (중근)</th><td>x = ${fmt(x)}</td></tr>
    `;
  } else {
    const re = -b / (2*a);
    const im = Math.sqrt(-D) / (2*a);
    miniScreen.textContent = `x = ${fmt(re)} ± ${fmt(im)}i`;
    miniScreenSub.textContent = '허근 (실근 없음)';
    statBody.innerHTML = `
      <tr><th>방정식</th><td>${a}x² + ${b}x + ${c} = 0</td></tr>
      <tr><th>판별식 (D)</th><td>${fmt(D)} (D &lt; 0, 실근 없음)</td></tr>
      <tr class="stat-highlight"><th>근 1</th><td>x₁ = ${fmt(re)} + ${fmt(im)}i</td></tr>
      <tr class="stat-highlight"><th>근 2</th><td>x₂ = ${fmt(re)} − ${fmt(im)}i</td></tr>
    `;
  }

  UrlState.sync({ a, b, c }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  a: document.getElementById('q-a').defaultValue,
  b: document.getElementById('q-b').defaultValue,
  c: document.getElementById('q-c').defaultValue
};

const urlParams = UrlState.read();
['a','b','c'].forEach(k=>{
  const el = document.getElementById('q-' + k);
  if (urlParams[k] && el) el.value = urlParams[k];
});

document.querySelectorAll('#q-a, #q-b, #q-c').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
