let gender = 'male';
let activity = 1.55;
let goal = 'maintain';

const GOAL_LABEL = { lose: '감량', maintain: '유지', gain: '증량' };
const GOAL_DELTA = { lose: -500, maintain: 0, gain: 500 };

function fmt0(n){ return Math.round(n).toLocaleString('ko-KR'); }

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'gender') gender = btn.dataset.value;
      if (group.dataset.target === 'activity') activity = parseFloat(btn.dataset.value);
      if (group.dataset.target === 'goal') goal = btn.dataset.value;
      recalc();
    });
  });
});

function recalc(){
  const age = parseFloat(document.getElementById('cl-age').value);
  const height = parseFloat(document.getElementById('cl-height').value);
  const weight = parseFloat(document.getElementById('cl-weight').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const macroBody = document.getElementById('macroBody');
  const meta = document.getElementById('page-meta');

  if (!age || !height || !weight){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">나이·키·몸무게를 입력해 주세요</td></tr>';
    macroBody.innerHTML = '';
    meta.textContent = '--';
    return;
  }

  const base = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  const tdee = bmr * activity;
  const targetCal = tdee + GOAL_DELTA[goal];

  const carbCal = targetCal * 0.5;
  const proteinCal = targetCal * 0.2;
  const fatCal = targetCal * 0.3;
  const carbG = carbCal / 4;
  const proteinG = proteinCal / 4;
  const fatG = fatCal / 9;

  miniScreen.textContent = fmt0(targetCal) + ' kcal';
  miniScreenSub.textContent = `목표: ${GOAL_LABEL[goal]}`;
  meta.textContent = `나이 ${age}세 · 키 ${height}cm · 몸무게 ${weight}kg · ${gender === 'male' ? '남성' : '여성'} · 목표 ${GOAL_LABEL[goal]}`;

  statBody.innerHTML = `
    <tr><th>기초대사량 (BMR)</th><td>${fmt0(bmr)} kcal</td></tr>
    <tr><th>활동대사량 (TDEE)</th><td>${fmt0(tdee)} kcal</td></tr>
    <tr class="stat-highlight"><th>목표 칼로리 (${GOAL_LABEL[goal]})</th><td>${fmt0(targetCal)} kcal</td></tr>
  `;

  macroBody.innerHTML = `
    <tr><th>탄수화물 (50%)</th><td>${fmt0(carbG)}g (${fmt0(carbCal)}kcal)</td></tr>
    <tr><th>단백질 (20%)</th><td>${fmt0(proteinG)}g (${fmt0(proteinCal)}kcal)</td></tr>
    <tr><th>지방 (30%)</th><td>${fmt0(fatG)}g (${fmt0(fatCal)}kcal)</td></tr>
  `;

  UrlState.sync({ age, height, weight, gender, activity, goal }, URL_DEFAULTS);
}

['cl-age','cl-height','cl-weight'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

const URL_DEFAULTS = {
  age: document.getElementById('cl-age').defaultValue,
  height: document.getElementById('cl-height').defaultValue,
  weight: document.getElementById('cl-weight').defaultValue,
  gender: toggleDefault('gender'),
  activity: toggleDefault('activity'),
  goal: toggleDefault('goal')
};

const urlParams = UrlState.read();
if (urlParams.age) document.getElementById('cl-age').value = urlParams.age;
if (urlParams.height) document.getElementById('cl-height').value = urlParams.height;
if (urlParams.weight) document.getElementById('cl-weight').value = urlParams.weight;
if (urlParams.gender) clickToggle('gender', urlParams.gender);
if (urlParams.activity) clickToggle('activity', urlParams.activity);
if (urlParams.goal) clickToggle('goal', urlParams.goal);

recalc();
