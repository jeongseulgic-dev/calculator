let mode = 'dec2bin';

function fmt(n){ return n.toLocaleString('ko-KR'); }

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

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'dec2bin'){
    const raw = document.getElementById('b-dec').value;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || String(raw).trim() === ''){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0 이상의 정수를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const bin = n.toString(2);
    miniScreen.textContent = bin;
    miniScreenSub.textContent = `10진수 ${fmt(n)}`;
    meta.textContent = `${fmt(n)} → 2진수`;
    statBody.innerHTML = `
      <tr><th>10진수</th><td>${fmt(n)}</td></tr>
      <tr class="stat-highlight"><th>2진수</th><td>${bin}</td></tr>
      <tr><th>자릿수</th><td>${bin.length}비트</td></tr>
    `;
    UrlState.sync({ mode, dec: n }, URL_DEFAULTS);
  }

  else if (mode === 'bin2dec'){
    const raw = document.getElementById('b-bin').value.trim();
    const valid = raw.length > 0 && /^[01]+$/.test(raw);
    if (!valid){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0과 1로만 이루어진 2진수를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const dec = parseInt(raw, 2);
    miniScreen.textContent = fmt(dec);
    miniScreenSub.textContent = `2진수 ${raw}`;
    meta.textContent = `${raw} → 10진수`;
    statBody.innerHTML = `
      <tr><th>2진수</th><td>${raw}</td></tr>
      <tr class="stat-highlight"><th>10진수</th><td>${fmt(dec)}</td></tr>
    `;
    UrlState.sync({ mode, bin: raw }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  dec: document.getElementById('b-dec').defaultValue,
  bin: document.getElementById('b-bin').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.dec) document.getElementById('b-dec').value = urlParams.dec;
if (urlParams.bin) document.getElementById('b-bin').value = urlParams.bin;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#b-dec, #b-bin').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
