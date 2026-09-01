function fmt(n){ return Math.round(n).toLocaleString('ko-KR'); }

function recalc(){
  const activitySelect = document.getElementById('c-activity');
  const met = parseFloat(activitySelect.value);
  const weight = parseFloat(document.getElementById('c-weight').value);
  const minutes = parseFloat(document.getElementById('c-minutes').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!weight || weight <= 0 || !minutes || minutes <= 0){
    miniScreen.textContent = '0 kcal';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">체중과 운동 시간을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const activityLabel = activitySelect.options[activitySelect.selectedIndex].text;
  const calories = met * 3.5 * weight * minutes / 200;
  const perMinute = calories / minutes;

  miniScreen.textContent = fmt(calories) + ' kcal';
  miniScreenSub.textContent = activityLabel;
  meta.textContent = `${activityLabel} · 체중 ${weight}kg · ${minutes}분`;

  statBody.innerHTML = `
    <tr><th>활동</th><td>${activityLabel}</td></tr>
    <tr><th>MET 값</th><td>${met}</td></tr>
    <tr><th>분당 소모 칼로리</th><td>${fmt(perMinute)} kcal/분</td></tr>
    <tr class="stat-highlight"><th>총 소모 칼로리</th><td>${fmt(calories)} kcal</td></tr>
  `;

  UrlState.sync({ activity: activitySelect.selectedIndex, weight, minutes }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  activity: document.getElementById('c-activity').selectedIndex,
  weight: document.getElementById('c-weight').defaultValue,
  minutes: document.getElementById('c-minutes').defaultValue
};

const urlParams = UrlState.read();
if (urlParams.activity != null){
  const select = document.getElementById('c-activity');
  const idx = parseInt(urlParams.activity);
  if (!isNaN(idx) && select.options[idx]) select.selectedIndex = idx;
}
if (urlParams.weight) document.getElementById('c-weight').value = urlParams.weight;
if (urlParams.minutes) document.getElementById('c-minutes').value = urlParams.minutes;

document.getElementById('c-activity').addEventListener('change', recalc);
document.getElementById('c-weight').addEventListener('input', recalc);
document.getElementById('c-minutes').addEventListener('input', recalc);

recalc();
