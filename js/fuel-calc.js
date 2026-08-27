let tripType = 'oneway';

function fmt0(n){ return Math.round(n).toLocaleString('ko-KR'); }
function fmt1(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits: 1 }); }

document.querySelectorAll('.seg-toggle[data-target="tripType"] .seg-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.seg-toggle[data-target="tripType"] .seg-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    tripType = btn.dataset.value;
    recalc();
  });
});

document.getElementById('f-price').addEventListener('input', function(){ formatInputComma(this); recalc(); });

function recalc(){
  const distance = parseFloat(document.getElementById('f-distance').value);
  const repeat = parseInt(document.getElementById('f-repeat').value) || 1;
  const efficiency = parseFloat(document.getElementById('f-efficiency').value);
  const price = Number(document.getElementById('f-price').value.replace(/,/g, ''));

  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (!distance || !efficiency || !price){
    miniScreen.textContent = '0원';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">주행거리·연비·연료 가격을 입력해 주세요</td></tr>';
    meta.textContent = '--';
    return;
  }

  const totalDistance = distance * (tripType === 'round' ? 2 : 1) * repeat;
  const fuelNeeded = totalDistance / efficiency;
  const totalCost = fuelNeeded * price;
  const costPerKm = price / efficiency;

  miniScreen.textContent = fmt0(totalCost) + '원';
  miniScreenSub.textContent = '총 유류비';

  statBody.innerHTML = `
    <tr><th>총 주행거리</th><td>${fmt1(totalDistance)}km</td></tr>
    <tr><th>필요 연료량</th><td>${fmt1(fuelNeeded)}L</td></tr>
    <tr><th>km당 비용</th><td>${fmt0(costPerKm)}원/km</td></tr>
    <tr class="stat-highlight"><th>총 유류비</th><td>${fmt0(totalCost)}원</td></tr>
  `;

  meta.textContent = `주행거리 ${fmt1(distance)}km(${tripType === 'round' ? '왕복' : '편도'}${repeat > 1 ? ` ${repeat}회` : ''}) · 연비 ${fmt1(efficiency)}km/L · 유가 ${fmt0(price)}원/L`;

  UrlState.sync({
    distance, tripType, repeat, efficiency, price
  }, URL_DEFAULTS);
}

document.querySelectorAll('#f-distance, #f-repeat, #f-efficiency').forEach(el=>{
  el.addEventListener('input', recalc);
});

const URL_DEFAULTS = {
  distance: document.getElementById('f-distance').defaultValue,
  tripType: toggleDefault('tripType'),
  repeat: document.getElementById('f-repeat').defaultValue,
  efficiency: document.getElementById('f-efficiency').defaultValue,
  price: ''
};

const urlParams = UrlState.read();
if (urlParams.distance) document.getElementById('f-distance').value = urlParams.distance;
if (urlParams.repeat) document.getElementById('f-repeat').value = urlParams.repeat;
if (urlParams.efficiency) document.getElementById('f-efficiency').value = urlParams.efficiency;
if (urlParams.price) document.getElementById('f-price').value = Number(urlParams.price).toLocaleString('ko-KR');
if (urlParams.tripType) clickToggle('tripType', urlParams.tripType);

recalc();
