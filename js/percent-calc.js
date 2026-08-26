let mode = 'of';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:2 }); }

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

  if (mode === 'of'){
    const percent = parseFloat(document.getElementById('p-percent').value);
    const base = parseFloat(document.getElementById('p-base').value);
    if (isNaN(percent) || isNaN(base)){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">퍼센트와 기준값을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const result = base * percent / 100;
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = `${fmt(base)}의 ${fmt(percent)}%`;
    meta.textContent = `퍼센트 ${fmt(percent)}% · 기준값 ${fmt(base)}`;
    statBody.innerHTML = `
      <tr><th>퍼센트</th><td>${fmt(percent)}%</td></tr>
      <tr><th>기준값</th><td>${fmt(base)}</td></tr>
      <tr class="stat-highlight"><th>결과값</th><td>${fmt(result)}</td></tr>
    `;

    UrlState.sync({ mode, percent, base }, URL_DEFAULTS);
  }

  else if (mode === 'ratio'){
    const part = parseFloat(document.getElementById('p-part').value);
    const whole = parseFloat(document.getElementById('p-whole').value);
    if (isNaN(part) || isNaN(whole) || whole === 0){
      miniScreen.textContent = '0%';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">부분값과 전체값을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const result = part / whole * 100;
    miniScreen.textContent = fmt(result) + '%';
    miniScreenSub.textContent = `${fmt(part)}는 ${fmt(whole)}의 비율`;
    meta.textContent = `부분값 ${fmt(part)} · 전체값 ${fmt(whole)}`;
    statBody.innerHTML = `
      <tr><th>부분값 (A)</th><td>${fmt(part)}</td></tr>
      <tr><th>전체값 (B)</th><td>${fmt(whole)}</td></tr>
      <tr class="stat-highlight"><th>비율 (A/B)</th><td>${fmt(result)}%</td></tr>
    `;

    UrlState.sync({ mode, part, whole }, URL_DEFAULTS);
  }

  else if (mode === 'change'){
    const oldVal = parseFloat(document.getElementById('p-old').value);
    const newVal = parseFloat(document.getElementById('p-new').value);
    if (isNaN(oldVal) || isNaN(newVal) || oldVal === 0){
      miniScreen.textContent = '0%';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">기존값과 변경값을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }
    const diff = newVal - oldVal;
    const rate = diff / oldVal * 100;
    const sign = rate >= 0 ? '+' : '';
    const label = rate >= 0 ? '증가' : '감소';
    miniScreen.textContent = sign + fmt(rate) + '%';
    miniScreenSub.textContent = `${fmt(oldVal)} → ${fmt(newVal)} (${label})`;
    meta.textContent = `기존값 ${fmt(oldVal)} · 변경값 ${fmt(newVal)}`;
    statBody.innerHTML = `
      <tr><th>기존값</th><td>${fmt(oldVal)}</td></tr>
      <tr><th>변경값</th><td>${fmt(newVal)}</td></tr>
      <tr><th>증감액</th><td>${sign}${fmt(diff)}</td></tr>
      <tr class="stat-highlight"><th>증감률</th><td>${sign}${fmt(rate)}% (${label})</td></tr>
    `;

    UrlState.sync({ mode, old: oldVal, new: newVal }, URL_DEFAULTS);
  }
}

document.querySelectorAll('#p-percent, #p-base, #p-part, #p-whole, #p-old, #p-new').forEach(el=>{
  el.addEventListener('input', recalc);
});

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  percent: document.getElementById('p-percent').defaultValue,
  base: document.getElementById('p-base').defaultValue,
  part: document.getElementById('p-part').defaultValue,
  whole: document.getElementById('p-whole').defaultValue,
  old: document.getElementById('p-old').defaultValue,
  new: document.getElementById('p-new').defaultValue
};

const urlParams = UrlState.read();
['percent','base','part','whole','old','new'].forEach(k=>{
  const el = document.getElementById('p-' + k);
  if (urlParams[k] && el) el.value = urlParams[k];
});
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
