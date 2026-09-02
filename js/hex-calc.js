let mode = 'dec2hex';

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

  if (mode === 'dec2hex'){
    const raw = document.getElementById('h-dec').value;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0 || String(raw).trim() === ''){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0 이상의 정수를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const hex = n.toString(16).toUpperCase();
    miniScreen.textContent = '0x' + hex;
    miniScreenSub.textContent = `10진수 ${fmt(n)}`;
    meta.textContent = `${fmt(n)} → 16진수`;
    statBody.innerHTML = `
      <tr><th>10진수</th><td>${fmt(n)}</td></tr>
      <tr class="stat-highlight"><th>16진수</th><td>0x${hex}</td></tr>
    `;
    UrlState.sync({ mode, dec: n }, URL_DEFAULTS);
  }

  else if (mode === 'hex2dec'){
    const raw = document.getElementById('h-hex').value.trim().replace(/^0x/i, '');
    const valid = raw.length > 0 && /^[0-9a-fA-F]+$/.test(raw);
    if (!valid){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">0-9, A-F로 이루어진 16진수를 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const dec = parseInt(raw, 16);
    miniScreen.textContent = fmt(dec);
    miniScreenSub.textContent = `16진수 0x${raw.toUpperCase()}`;
    meta.textContent = `0x${raw.toUpperCase()} → 10진수`;
    statBody.innerHTML = `
      <tr><th>16진수</th><td>0x${raw.toUpperCase()}</td></tr>
      <tr class="stat-highlight"><th>10진수</th><td>${fmt(dec)}</td></tr>
    `;
    UrlState.sync({ mode, hex: raw }, URL_DEFAULTS);
  }
}

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  dec: document.getElementById('h-dec').defaultValue,
  hex: document.getElementById('h-hex').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.dec) document.getElementById('h-dec').value = urlParams.dec;
if (urlParams.hex) document.getElementById('h-hex').value = urlParams.hex;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

document.querySelectorAll('#h-dec, #h-hex').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
