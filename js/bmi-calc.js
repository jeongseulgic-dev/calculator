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
  const age = parseFloat(document.getElementById('b-age').value);

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
  const normalMin = 18.5 * h * h;
  const normalMax = 22.9 * h * h;
  const isMinor = age && age < 19;

  miniScreen.textContent = fmt1(bmi);

  if (isMinor){
    miniScreenSub.textContent = '소아청소년 · 별도 기준 필요';
    statBody.innerHTML = `
      <tr><th>키</th><td>${height} cm</td></tr>
      <tr><th>몸무게</th><td>${weight} kg</td></tr>
      <tr class="stat-highlight"><th>BMI 지수</th><td>${fmt1(bmi)}</td></tr>
      <tr><td colspan="2" style="text-align:center; color:var(--ink-soft); font-size:0.8rem;">만 19세 미만은 성인 기준(저체중~고도비만)을 적용하지 않습니다.<br>소아청소년과의 연령별 성장도표(백분위수)로 평가받아야 정확합니다.</td></tr>
    `;
    return;
  }

  const cat = bmiCategory(bmi);
  miniScreenSub.textContent = `${cat.label} · BMI 지수`;

  statBody.innerHTML = `
    <tr><th>키</th><td>${height} cm</td></tr>
    <tr><th>몸무게</th><td>${weight} kg</td></tr>
    <tr class="stat-highlight"><th>BMI 지수</th><td style="color:${cat.color};">${fmt1(bmi)} (${cat.label})</td></tr>
    <tr><th>정상 체중 범위</th><td>${fmt1(normalMin)} ~ ${fmt1(normalMax)} kg</td></tr>
  `;
}

['b-height','b-weight','b-age'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

recalc();
