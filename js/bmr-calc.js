let gender = 'male';
let activity = 1.55;

function fmt0(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'gender') gender = btn.dataset.value;
      if (group.dataset.target === 'activity') activity = parseFloat(btn.dataset.value);
      recalc();
    });
  });
});

function recalc(){
  const age = parseFloat(document.getElementById('m-age').value);
  const height = parseFloat(document.getElementById('m-height').value);
  const weight = parseFloat(document.getElementById('m-weight').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!age || !height || !weight){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">나이·키·몸무게를 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  const tdee = bmr * activity;

  miniScreen.textContent = fmt0(tdee) + ' kcal';
  miniScreenSub.textContent = '하루 활동대사량 (TDEE)';
  meta.textContent = `나이 ${age}세 · 키 ${height}cm · 몸무게 ${weight}kg · ${gender === 'male' ? '남성' : '여성'}`;

  statBody.innerHTML = `
    <tr><th>기초대사량 (BMR)</th><td>${fmt0(bmr)} kcal</td></tr>
    <tr class="stat-highlight"><th>활동대사량 (TDEE)</th><td>${fmt0(tdee)} kcal</td></tr>
    <tr><th>체중 유지 권장 섭취량</th><td>약 ${fmt0(tdee)} kcal</td></tr>
    <tr><th>체중 감량 권장 섭취량 (−15%)</th><td>약 ${fmt0(tdee*0.85)} kcal</td></tr>
  `;

  UrlState.sync({ age, height, weight, gender, activity }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  age: document.getElementById('m-age').defaultValue,
  height: document.getElementById('m-height').defaultValue,
  weight: document.getElementById('m-weight').defaultValue,
  gender: toggleDefault('gender'),
  activity: toggleDefault('activity')
};

['m-age','m-height','m-weight'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

const urlParams = UrlState.read();
if (urlParams.age) document.getElementById('m-age').value = urlParams.age;
if (urlParams.height) document.getElementById('m-height').value = urlParams.height;
if (urlParams.weight) document.getElementById('m-weight').value = urlParams.weight;
if (urlParams.gender) clickToggle('gender', urlParams.gender);
if (urlParams.activity) clickToggle('activity', urlParams.activity);

recalc();
