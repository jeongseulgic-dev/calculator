const ZODIAC = ['원숭이','닭','개','돼지','쥐','소','호랑이','토끼','용','뱀','말','양'];
const DAY_MS = 86400000;

function dayDiff(a, b){
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY_MS);
}

// 2월 29일생은 평년에 new Date(y, 1, 29)가 3월 1일로 넘어가며, 민법상 나이가 오르는 날과 같다.
function ageUpDay(birth, year){
  return new Date(year, birth.getMonth(), birth.getDate());
}

function addMonthsClamped(d, n){
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}

function fmtDate(d){
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fail(msg){
  document.getElementById('miniScreen').textContent = '0세';
  document.getElementById('miniScreenSub').textContent = '';
  document.getElementById('statBody').innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">${msg}</td></tr>`;
  document.getElementById('page-meta').textContent = '--';
}

function recalc(){
  const val = document.getElementById('a-birth').value;
  const refVal = document.getElementById('a-ref').value;

  const birth = parseIsoDate(val);
  if (!birth){
    fail('생년월일을 YYYY-MM-DD 형식으로 입력해 주세요');
    return;
  }

  let ref;
  if (refVal){
    ref = parseIsoDate(refVal);
    if (!ref){
      fail('기준일을 YYYY-MM-DD 형식으로 입력하거나 비워 두세요');
      return;
    }
  } else {
    ref = new Date();
    ref.setHours(0,0,0,0);
  }

  if (birth > ref){
    fail(refVal ? '생년월일이 기준일보다 미래입니다' : '생년월일이 오늘보다 미래입니다');
    return;
  }

  const thisYearUp = ageUpDay(birth, ref.getFullYear());
  const hadBirthday = ref >= thisYearUp;
  const manAge = ref.getFullYear() - birth.getFullYear() - (hadBirthday ? 0 : 1);
  const yeonAge = ref.getFullYear() - birth.getFullYear();
  const seNunAge = yeonAge + 1;

  const lastUp = hadBirthday ? thisYearUp : ageUpDay(birth, ref.getFullYear() - 1);
  const nextUp = hadBirthday ? ageUpDay(birth, ref.getFullYear() + 1) : thisYearUp;
  const sangRyeong = addMonthsClamped(lastUp, 6);
  const insuranceAge = manAge + (ref >= sangRyeong ? 1 : 0);
  const nextSangRyeong = ref >= sangRyeong ? addMonthsClamped(nextUp, 6) : sangRyeong;

  const livedDays = dayDiff(birth, ref) + 1;
  const isBirthday = dayDiff(lastUp, ref) === 0;
  const daysToBirthday = dayDiff(ref, nextUp);
  const zodiac = ZODIAC[birth.getFullYear() % 12];
  const refLabel = refVal ? '기준일' : '오늘';

  const miniScreen = document.getElementById('miniScreen');
  miniScreen.textContent = manAge + '세';
  document.getElementById('miniScreenSub').textContent = refVal ? `만 나이 (${refVal} 기준)` : '만 나이';
  document.getElementById('page-meta').textContent = `생년월일 ${val}` + (refVal ? ` · 기준일 ${refVal}` : '');

  document.getElementById('statBody').innerHTML = `
    <tr class="stat-highlight"><th>만 나이</th><td>${manAge}세</td></tr>
    <tr><th>연 나이 (일부 법령 기준)</th><td>${yeonAge}세</td></tr>
    <tr><th>세는 나이 (전통적 나이)</th><td>${seNunAge}세</td></tr>
    <tr><th>보험나이 (다음 상령일 ${fmtDate(nextSangRyeong)})</th><td>${insuranceAge}세</td></tr>
    <tr><th>살아온 날 (출생일 포함)</th><td>${livedDays.toLocaleString('ko-KR')}일째</td></tr>
    <tr><th>다음 생일까지</th><td>${isBirthday ? `${refLabel}이 생일입니다` : `${daysToBirthday}일 (${fmtDate(nextUp)})`}</td></tr>
    <tr><th>띠 (출생 연도 기준)</th><td>${zodiac}띠</td></tr>
  `;

  document.getElementById('nextDday').href = `dday-calculator?target=${fmtDate(nextUp)}`;

  UrlState.sync({ birth: val, ref: refVal });
}

attachDateMask('a-birth', recalc);
attachDateMask('a-ref', recalc);

const urlParams = UrlState.read();
if (urlParams.birth) document.getElementById('a-birth').value = urlParams.birth;
if (urlParams.ref) document.getElementById('a-ref').value = urlParams.ref;

recalc();
