let category = 'length';

function fmt(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:6 }); }

const UNITS = {
  length: {
    label: '길이',
    base: {
      mm: 0.001, cm: 0.01, m: 1, km: 1000,
      in: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344
    },
    names: { mm:'밀리미터(mm)', cm:'센티미터(cm)', m:'미터(m)', km:'킬로미터(km)', in:'인치(in)', ft:'피트(ft)', yd:'야드(yd)', mile:'마일(mile)' }
  },
  weight: {
    label: '무게',
    base: {
      mg: 0.001, g: 1, kg: 1000, t: 1000000,
      oz: 28.349523125, lb: 453.59237
    },
    names: { mg:'밀리그램(mg)', g:'그램(g)', kg:'킬로그램(kg)', t:'톤(t)', oz:'온스(oz)', lb:'파운드(lb)' }
  }
};

function toCelsius(value, unit){
  if (unit === 'C') return value;
  if (unit === 'F') return (value - 32) * 5 / 9;
  return value - 273.15; // K
}
function fromCelsius(celsius, unit){
  if (unit === 'C') return celsius;
  if (unit === 'F') return celsius * 9 / 5 + 32;
  return celsius + 273.15; // K
}
const TEMP_NAMES = { C:'섭씨(℃)', F:'화씨(℉)', K:'켈빈(K)' };

function buildUnitOptions(selectEl, unitDef, selected){
  selectEl.innerHTML = Object.keys(unitDef.base).map(u =>
    `<option value="${u}" ${u===selected?'selected':''}>${unitDef.names[u]}</option>`
  ).join('');
}

document.querySelectorAll('.seg-toggle[data-target="category"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="category"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    category = btn.dataset.value;
    document.querySelectorAll('.mode-field').forEach(f=>{
      f.classList.toggle('hidden', f.dataset.mode !== category);
    });
    recalc();
  });
});

document.getElementById('u-swap-length').addEventListener('click', ()=>{
  const from = document.getElementById('u-length-from');
  const to = document.getElementById('u-length-to');
  [from.value, to.value] = [to.value, from.value];
  recalc();
});
document.getElementById('u-swap-weight').addEventListener('click', ()=>{
  const from = document.getElementById('u-weight-from');
  const to = document.getElementById('u-weight-to');
  [from.value, to.value] = [to.value, from.value];
  recalc();
});
document.getElementById('u-swap-temp').addEventListener('click', ()=>{
  const from = document.getElementById('u-temp-from');
  const to = document.getElementById('u-temp-to');
  [from.value, to.value] = [to.value, from.value];
  recalc();
});

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  if (category === 'temperature'){
    const value = parseFloat(document.getElementById('u-temp-value').value);
    const fromUnit = document.getElementById('u-temp-from').value;
    const toUnit = document.getElementById('u-temp-to').value;
    if (isNaN(value)){
      miniScreen.textContent = '0';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">값을 입력해 주세요</td></tr>';
      return;
    }
    const result = fromCelsius(toCelsius(value, fromUnit), toUnit);
    miniScreen.textContent = fmt(result);
    miniScreenSub.textContent = TEMP_NAMES[toUnit];
    statBody.innerHTML = `
      <tr><th>입력값</th><td>${fmt(value)} ${TEMP_NAMES[fromUnit]}</td></tr>
      <tr class="stat-highlight"><th>변환 결과</th><td>${fmt(result)} ${TEMP_NAMES[toUnit]}</td></tr>
    `;
    return;
  }

  const def = UNITS[category];
  const value = parseFloat(document.getElementById(`u-${category}-value`).value);
  const fromUnit = document.getElementById(`u-${category}-from`).value;
  const toUnit = document.getElementById(`u-${category}-to`).value;

  if (isNaN(value)){
    miniScreen.textContent = '0';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">값을 입력해 주세요</td></tr>';
    return;
  }

  const baseValue = value * def.base[fromUnit];
  const result = baseValue / def.base[toUnit];
  const factor = def.base[fromUnit] / def.base[toUnit];

  miniScreen.textContent = fmt(result);
  miniScreenSub.textContent = def.names[toUnit];
  statBody.innerHTML = `
    <tr><th>입력값</th><td>${fmt(value)} ${def.names[fromUnit]}</td></tr>
    <tr class="stat-highlight"><th>변환 결과</th><td>${fmt(result)} ${def.names[toUnit]}</td></tr>
    <tr><th>환산 비율</th><td>1 ${fromUnit} = ${fmt(factor)} ${toUnit}</td></tr>
  `;
}

buildUnitOptions(document.getElementById('u-length-from'), UNITS.length, 'cm');
buildUnitOptions(document.getElementById('u-length-to'), UNITS.length, 'in');
buildUnitOptions(document.getElementById('u-weight-from'), UNITS.weight, 'kg');
buildUnitOptions(document.getElementById('u-weight-to'), UNITS.weight, 'lb');

['u-length-value','u-length-from','u-length-to',
 'u-weight-value','u-weight-from','u-weight-to',
 'u-temp-value','u-temp-from','u-temp-to'].forEach(id=>{
  document.getElementById(id).addEventListener('input', recalc);
  document.getElementById(id).addEventListener('change', recalc);
});

recalc();
