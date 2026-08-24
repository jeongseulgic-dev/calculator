let gender = 'male';

function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:1, minimumFractionDigits:1 }); }
function toInches(cm){ return cm * 0.3937007874; }

document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="gender"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    gender = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== gender);
    });
    recalc();
  });
});

function bfCategory(g, bf){
  const table = g === 'male'
    ? [[5,'필수지방'],[13,'운동선수'],[17,'피트니스'],[24,'평균']]
    : [[13,'필수지방'],[20,'운동선수'],[24,'피트니스'],[31,'평균']];
  for (const [max,label] of table){ if (bf <= max) return label; }
  return '비만';
}

function recalc(){
  const height = parseFloat(document.getElementById('f-height').value);
  const weight = parseFloat(document.getElementById('f-weight').value);
  const neck = parseFloat(document.getElementById('f-neck').value);
  const waist = parseFloat(document.getElementById('f-waist').value);
  const hip = parseFloat(document.getElementById('f-hip').value);

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  const needHip = gender === 'female';
  const inputsOk = height && weight && neck && waist && (!needHip || hip);

  if (!inputsOk){
    miniScreen.textContent = '0.0%';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">키·몸무게·목둘레·허리둘레를 입력해 주세요</td></tr>';
    return;
  }

  const h = toInches(height), w = toInches(waist), n = toInches(neck);
  let bodyFat;
  if (gender === 'male'){
    if (w - n <= 0){
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">허리둘레가 목둘레보다 커야 계산할 수 있습니다</td></tr>';
      return;
    }
    bodyFat = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  } else {
    const hp = toInches(hip);
    if (w + hp - n <= 0){
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">허리+엉덩이둘레 합이 목둘레보다 커야 계산할 수 있습니다</td></tr>';
      return;
    }
    bodyFat = 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
  }
  bodyFat = Math.max(bodyFat, 0);

  const fatMass = weight * bodyFat / 100;
  const leanMass = weight - fatMass;
  const category = bfCategory(gender, bodyFat);

  miniScreen.textContent = fmt1(bodyFat) + '%';
  miniScreenSub.textContent = `분류: ${category}`;

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>체지방률</th><td>${fmt1(bodyFat)}% (${category})</td></tr>
    <tr><th>체지방량</th><td>${fmt1(fatMass)} kg</td></tr>
    <tr><th>제지방량 (근육·뼈 등)</th><td>${fmt1(leanMass)} kg</td></tr>
  `;
}

['f-height','f-weight','f-neck','f-waist','f-hip'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
});

recalc();
