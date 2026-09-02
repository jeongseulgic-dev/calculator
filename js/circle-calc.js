let mode = 'r';

function fmt(n, digits){ return n.toLocaleString('ko-KR', { maximumFractionDigits: digits !== undefined ? digits : 4 }); }

document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="mode"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== mode);
    });
    recalc();
  });
});

function fail(msg){
  document.getElementById('miniScreen').textContent = '0';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  let r;
  let inputLabel, inputVal;

  if (mode === 'r'){
    r = parseFloat(document.getElementById('ci-rv').value);
    inputLabel = '반지름'; inputVal = r;
  } else if (mode === 'd'){
    const d = parseFloat(document.getElementById('ci-dv').value);
    r = d / 2;
    inputLabel = '지름'; inputVal = d;
  } else if (mode === 'c'){
    const c = parseFloat(document.getElementById('ci-cv').value);
    r = c / (2 * Math.PI);
    inputLabel = '둘레'; inputVal = c;
  } else if (mode === 'a'){
    const a = parseFloat(document.getElementById('ci-av').value);
    r = Math.sqrt(a / Math.PI);
    inputLabel = '넓이'; inputVal = a;
  }

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!Number.isFinite(r) || r <= 0){
    fail(`${inputLabel}(0보다 큼)을 입력해 주세요`);
    return;
  }

  const d = 2 * r;
  const c = 2 * Math.PI * r;
  const a = Math.PI * r * r;

  miniScreen.textContent = fmt(r);
  miniScreenSub.textContent = '반지름';
  meta.textContent = `${inputLabel}=${inputVal}`;

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>반지름</th><td>${fmt(r)}</td></tr>
    <tr class="stat-highlight"><th>지름</th><td>${fmt(d)}</td></tr>
    <tr class="stat-highlight"><th>둘레</th><td>${fmt(c)}</td></tr>
    <tr class="stat-highlight"><th>넓이</th><td>${fmt(a)}</td></tr>
  `;

  UrlState.sync({ mode, rv: document.getElementById('ci-rv').value, dv: document.getElementById('ci-dv').value, cv: document.getElementById('ci-cv').value, av: document.getElementById('ci-av').value }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  rv: document.getElementById('ci-rv').defaultValue,
  dv: document.getElementById('ci-dv').defaultValue,
  cv: document.getElementById('ci-cv').defaultValue,
  av: document.getElementById('ci-av').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.rv) document.getElementById('ci-rv').value = urlParams.rv;
if (urlParams.dv) document.getElementById('ci-dv').value = urlParams.dv;
if (urlParams.cv) document.getElementById('ci-cv').value = urlParams.cv;
if (urlParams.av) document.getElementById('ci-av').value = urlParams.av;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#ci-rv, #ci-dv, #ci-cv, #ci-av').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
