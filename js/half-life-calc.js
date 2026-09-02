let mode = 'nt';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:4 }); }

const SOLVE_LABEL = { nt: '잔여량', n0: '초기량', t: '경과 시간', half: '반감기' };

document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="solve"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      const modes = f.dataset.mode.split(',');
      f.classList.toggle('hidden', !modes.includes(mode));
    });
    document.querySelector('.screen .label').textContent = SOLVE_LABEL[mode];
    recalc();
  });
});

function recalc(){
  const n0 = parseFloat(document.getElementById('hl-n0').value);
  const nt = parseFloat(document.getElementById('hl-nt').value);
  const halfLife = parseFloat(document.getElementById('hl-half').value);
  const t = parseFloat(document.getElementById('hl-t').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  function fail(msg){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
    meta.textContent = '--';
  }

  if (mode === 'nt'){
    if (!Number.isFinite(n0) || !Number.isFinite(halfLife) || !Number.isFinite(t) || n0 < 0 || halfLife <= 0 || t < 0){
      fail('초기량(0 이상), 반감기(0보다 큼), 경과시간(0 이상)을 입력해 주세요');
      return;
    }
    const result = n0 * Math.pow(0.5, t / halfLife);
    const pct = n0 === 0 ? 0 : result / n0 * 100;
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${fmt(pct)}% 남음`;
    meta.textContent = `초기량 ${fmt(n0)} · 반감기 ${fmt(halfLife)} · 경과 ${fmt(t)}`;
    statBody.innerHTML = `
      <tr><th>초기량</th><td>${fmt(n0)}</td></tr>
      <tr><th>반감기</th><td>${fmt(halfLife)}</td></tr>
      <tr><th>경과 시간</th><td>${fmt(t)} (${fmt(t/halfLife)}회 반감기 경과)</td></tr>
      <tr class="stat-highlight"><th>잔여량</th><td>${fmt(result)} (${fmt(pct)}%)</td></tr>
    `;
  }

  else if (mode === 'n0'){
    if (!Number.isFinite(nt) || !Number.isFinite(halfLife) || !Number.isFinite(t) || nt < 0 || halfLife <= 0 || t < 0){
      fail('잔여량(0 이상), 반감기(0보다 큼), 경과시간(0 이상)을 입력해 주세요');
      return;
    }
    const result = nt * Math.pow(2, t / halfLife);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${fmt(t/halfLife)}회 반감기 이전 초기량`;
    meta.textContent = `잔여량 ${fmt(nt)} · 반감기 ${fmt(halfLife)} · 경과 ${fmt(t)}`;
    statBody.innerHTML = `
      <tr><th>잔여량</th><td>${fmt(nt)}</td></tr>
      <tr><th>반감기</th><td>${fmt(halfLife)}</td></tr>
      <tr><th>경과 시간</th><td>${fmt(t)}</td></tr>
      <tr class="stat-highlight"><th>초기량</th><td>${fmt(result)}</td></tr>
    `;
  }

  else if (mode === 't'){
    if (!Number.isFinite(n0) || !Number.isFinite(nt) || !Number.isFinite(halfLife) || n0 <= 0 || nt <= 0 || nt > n0 || halfLife <= 0){
      fail('초기량 ≥ 잔여량 > 0, 반감기(0보다 큼)를 입력해 주세요');
      return;
    }
    const result = halfLife * Math.log(n0 / nt) / Math.log(2);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${fmt(result/halfLife)}회 반감기 경과`;
    meta.textContent = `초기량 ${fmt(n0)} · 잔여량 ${fmt(nt)} · 반감기 ${fmt(halfLife)}`;
    statBody.innerHTML = `
      <tr><th>초기량</th><td>${fmt(n0)}</td></tr>
      <tr><th>잔여량</th><td>${fmt(nt)}</td></tr>
      <tr><th>반감기</th><td>${fmt(halfLife)}</td></tr>
      <tr class="stat-highlight"><th>경과 시간</th><td>${fmt(result)}</td></tr>
    `;
  }

  else if (mode === 'half'){
    if (!Number.isFinite(n0) || !Number.isFinite(nt) || !Number.isFinite(t) || n0 <= 0 || nt <= 0 || nt > n0 || t <= 0){
      fail('초기량 ≥ 잔여량 > 0, 경과시간(0보다 큼)을 입력해 주세요');
      return;
    }
    const result = t * Math.log(2) / Math.log(n0 / nt);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = '';
    meta.textContent = `초기량 ${fmt(n0)} · 잔여량 ${fmt(nt)} · 경과 ${fmt(t)}`;
    statBody.innerHTML = `
      <tr><th>초기량</th><td>${fmt(n0)}</td></tr>
      <tr><th>잔여량</th><td>${fmt(nt)}</td></tr>
      <tr><th>경과 시간</th><td>${fmt(t)}</td></tr>
      <tr class="stat-highlight"><th>반감기</th><td>${fmt(result)}</td></tr>
    `;
  }

  UrlState.sync({ mode, n0, nt, half: halfLife, t }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  mode: toggleDefault('solve'),
  n0: document.getElementById('hl-n0').defaultValue,
  nt: document.getElementById('hl-nt').defaultValue,
  half: document.getElementById('hl-half').defaultValue,
  t: document.getElementById('hl-t').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.n0) document.getElementById('hl-n0').value = urlParams.n0;
if (urlParams.nt) document.getElementById('hl-nt').value = urlParams.nt;
if (urlParams.half) document.getElementById('hl-half').value = urlParams.half;
if (urlParams.t) document.getElementById('hl-t').value = urlParams.t;
if (urlParams.mode) clickToggle('solve', urlParams.mode);

document.querySelectorAll('#hl-n0, #hl-nt, #hl-half, #hl-t').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
