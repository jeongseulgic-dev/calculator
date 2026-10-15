function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:1, minimumFractionDigits:1 }); }

// 대한비만학회 비만 진료지침(2022, 8판) BMI 단계 — 아시아-태평양 기준(정상 상한 22.9)
const BMI_STAGES = [
  { max: 18.5, label:'저체중', color:'#3b82c4' },
  { max: 23,   label:'정상', color:'#3f6b4f' },
  { max: 25,   label:'비만 전단계', color:'#c99a2c' },
  { max: 30,   label:'1단계 비만', color:'#c23662' },
  { max: 35,   label:'2단계 비만', color:'#8a1f3f' },
  { max: Infinity, label:'3단계 비만', color:'#5c1229' }
];
// 같은 지침의 BMI × 허리둘레별 동반질환 위험도 (허리둘레 기준 미만 / 이상)
const RISK = [
  ['낮음', '보통'],
  ['보통', '약간 높음'],
  ['약간 높음', '높음'],
  ['높음', '매우 높음'],
  ['매우 높음', '가장 높음'],
  ['가장 높음', '가장 높음']
];
const WAIST_CUTOFF = { male: 90, female: 85 };   // 복부비만 허리둘레 기준 (cm)

function bmiStage(bmi){
  const i = BMI_STAGES.findIndex(s => bmi < s.max);
  return { ...BMI_STAGES[i], index: i };
}

document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    recalc();
  });
});

function recalc(){
  const height = parseFloat(document.getElementById('b-height').value);
  const weight = parseFloat(document.getElementById('b-weight').value);
  const waist = parseFloat(document.getElementById('b-waist').value);
  const gender = toggleDefault('gender');

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!(height > 0) || !(weight > 0)){
    miniScreen.textContent = '0.0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">키와 몸무게를 0보다 큰 값으로 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const h = height / 100;
  const bmi = weight / (h * h);
  const cat = bmiStage(bmi);
  const normalMin = 18.5 * h * h;
  const normalMax = 22.9 * h * h;

  let toNormal = '정상 범위 안';
  if (cat.index >= 2) toNormal = `${fmt1(weight - normalMax)} kg 감량`;
  else if (cat.index === 0) toNormal = `${fmt1(normalMin - weight)} kg 증량`;

  let waistRows = '';
  const hasWaist = waist > 0;
  if (hasWaist){
    const abdominal = waist >= WAIST_CUTOFF[gender];
    waistRows = `
    <tr><th>허리둘레</th><td>${waist} cm</td></tr>
    <tr><th>복부비만 여부</th><td>${abdominal ? '해당' : '해당 없음'}</td></tr>
    <tr><th>동반질환 위험</th><td>${RISK[cat.index][abdominal ? 1 : 0]}</td></tr>`;
  }

  miniScreen.textContent = fmt1(bmi);
  miniScreenSub.textContent = `${cat.label} · BMI 지수`;
  meta.textContent = `키 ${height}cm · 몸무게 ${weight}kg` + (hasWaist ? ` · 허리 ${waist}cm` : '');

  statBody.innerHTML = `
    <tr><th>키</th><td>${height} cm</td></tr>
    <tr><th>몸무게</th><td>${weight} kg</td></tr>
    <tr class="stat-highlight"><th>BMI 지수</th><td style="color:${cat.color};">${fmt1(bmi)} (${cat.label})</td></tr>
    <tr><th>정상 체중 범위</th><td>${fmt1(normalMin)} ~ ${fmt1(normalMax)} kg</td></tr>
    <tr><th>정상 범위까지</th><td>${toNormal}</td></tr>${waistRows}
  `;

  document.getElementById('nextBodyfat').href = `bodyfat-calculator?height=${height}&weight=${weight}${hasWaist ? `&waist=${waist}` : ''}&gender=${gender}`;
  document.getElementById('nextCalorie').href = `calorie-calculator?height=${height}&weight=${weight}&gender=${gender}`;

  UrlState.sync({ height, weight, waist: hasWaist ? waist : '', gender }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  height: document.getElementById('b-height').defaultValue,
  weight: document.getElementById('b-weight').defaultValue,
  gender: toggleDefault('gender')
};

['b-height','b-weight','b-waist'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

const urlParams = UrlState.read();
if (urlParams.height) document.getElementById('b-height').value = urlParams.height;
if (urlParams.weight) document.getElementById('b-weight').value = urlParams.weight;
if (urlParams.waist) document.getElementById('b-waist').value = urlParams.waist;
if (urlParams.gender) clickToggle('gender', urlParams.gender);

recalc();
