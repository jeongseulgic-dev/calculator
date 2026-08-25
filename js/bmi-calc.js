function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:1, minimumFractionDigits:1 }); }

function bmiCategory(bmi){
  if (bmi < 18.5) return { label:'저체중', color:'#3b82c4' };
  if (bmi < 23)   return { label:'정상', color:'#3f6b4f' };
  if (bmi < 25)   return { label:'과체중', color:'#c99a2c' };
  if (bmi < 30)   return { label:'비만', color:'#c23662' };
  return { label:'고도비만', color:'#8a1f3f' };
}

function recalc(){
  const height = parseFloat(document.getElementById('b-height').value);
  const weight = parseFloat(document.getElementById('b-weight').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  if (!height || !weight){
    miniScreen.textContent = '0.0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">키와 몸무게를 입력해 주세요</td></tr>';
    return;
  }

  const h = height / 100;
  const bmi = weight / (h * h);
  const cat = bmiCategory(bmi);
  const normalMin = 18.5 * h * h;
  const normalMax = 22.9 * h * h;

  miniScreen.textContent = fmt1(bmi);
  miniScreenSub.textContent = `${cat.label} · BMI 지수`;

  statBody.innerHTML = `
    <tr><th>키</th><td>${height} cm</td></tr>
    <tr><th>몸무게</th><td>${weight} kg</td></tr>
    <tr class="stat-highlight"><th>BMI 지수</th><td style="color:${cat.color};">${fmt1(bmi)} (${cat.label})</td></tr>
    <tr><th>정상 체중 범위</th><td>${fmt1(normalMin)} ~ ${fmt1(normalMax)} kg</td></tr>
  `;

  UrlState.sync({ height, weight }, URL_DEFAULTS);
}

const URL_DEFAULTS = {
  height: document.getElementById('b-height').defaultValue,
  weight: document.getElementById('b-weight').defaultValue
};

['b-height','b-weight'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

const urlParams = UrlState.read();
if (urlParams.height) document.getElementById('b-height').value = urlParams.height;
if (urlParams.weight) document.getElementById('b-weight').value = urlParams.weight;

recalc();
