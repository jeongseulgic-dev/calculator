let mode = 'wake';
const CYCLES = [4, 5, 6];
const BEST_CYCLES = 5;

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

function pad(n){ return String(n).padStart(2, '0'); }

function parseTimeToMinutes(hhmm){
  if (!hhmm) return null;
  const parts = hhmm.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

function formatMinutesToClock(totalMin){
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h < 12 ? '오전' : '오후';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${period} ${h12}:${pad(min)}`;
}

function formatDuration(totalMin){
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

function recalc(){
  const latency = parseInt(document.getElementById('s-latency').value) || 0;
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const grid = document.getElementById('compareGrid');
  const meta = document.getElementById('page-meta');

  const timeVal = mode === 'wake'
    ? document.getElementById('s-wake').value
    : document.getElementById('s-sleep').value;
  const baseMin = parseTimeToMinutes(timeVal);

  if (baseMin == null){
    grid.innerHTML = '<div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--ink-soft); font-size:0.85rem;">시간을 입력해 주세요</div>';
    miniScreen.textContent = '--:--';
    miniScreenSub.textContent = '';
    meta.textContent = '--';
    return;
  }

  const options = CYCLES.map(n=>{
    const totalMin = n * 90 + latency;
    const targetMin = mode === 'wake' ? baseMin - totalMin : baseMin + totalMin;
    return { n, sleepMin: n * 90, targetMin };
  });

  const best = options.find(o=>o.n === BEST_CYCLES);
  miniScreen.textContent = formatMinutesToClock(best.targetMin);
  miniScreenSub.textContent = `${formatDuration(best.sleepMin)} 수면 (${best.n}주기) 권장`;

  grid.innerHTML = options.map(o=>`
    <div class="method-card">
      ${o.n === BEST_CYCLES ? '<div class="stamp">권장<br>수면</div>' : ''}
      <h3>${o.n}주기</h3>
      <div class="sub">총 수면시간 ${formatDuration(o.sleepMin)}</div>
      <div class="method-row total"><span>${mode === 'wake' ? '취침 시각' : '기상 시각'}</span><span class="val">${formatMinutesToClock(o.targetMin)}</span></div>
    </div>
  `).join('');

  meta.textContent = mode === 'wake'
    ? `기상 ${timeVal} · 입면시간 ${latency}분`
    : `취침 ${timeVal} · 입면시간 ${latency}분`;

  UrlState.sync({
    mode, wake: document.getElementById('s-wake').value, sleep: document.getElementById('s-sleep').value, latency
  }, URL_DEFAULTS);
}

document.getElementById('s-wake').addEventListener('input', recalc);
document.getElementById('s-sleep').addEventListener('input', recalc);
document.getElementById('s-latency').addEventListener('input', recalc);

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  wake: document.getElementById('s-wake').defaultValue,
  sleep: document.getElementById('s-sleep').defaultValue,
  latency: document.getElementById('s-latency').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.wake) document.getElementById('s-wake').value = urlParams.wake;
if (urlParams.sleep) document.getElementById('s-sleep').value = urlParams.sleep;
if (urlParams.latency) document.getElementById('s-latency').value = urlParams.latency;
if (urlParams.mode) clickToggle('mode', urlParams.mode);

recalc();
