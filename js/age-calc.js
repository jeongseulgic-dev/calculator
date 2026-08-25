function recalc(){
  const val = document.getElementById('a-birth').value;
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const statBody = document.getElementById('statBody');

  const birth = parseIsoDate(val);
  if (!birth){
    miniScreen.textContent = '0세';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">생년월일을 YYYY-MM-DD 형식으로 입력해 주세요</td></tr>';
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  if (birth > today){
    miniScreen.textContent = '0세';
    miniScreenSub.textContent = '';
    statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">생년월일이 오늘보다 미래입니다</td></tr>';
    return;
  }

  // 만 나이 (2023년 만 나이 통일법 기준)
  let manAge = today.getFullYear() - birth.getFullYear();
  const hadBirthdayThisYear =
    (today.getMonth() > birth.getMonth()) ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthdayThisYear) manAge -= 1;

  const yeonAge = today.getFullYear() - birth.getFullYear(); // 연 나이 (일부 법령 기준)
  const seNunAge = today.getFullYear() - birth.getFullYear() + 1; // 세는 나이 (전통적 나이)

  miniScreen.textContent = manAge + '세';
  miniScreenSub.textContent = '만 나이';

  statBody.innerHTML = `
    <tr class="stat-highlight"><th>만 나이</th><td>${manAge}세</td></tr>
    <tr><th>연 나이 (일부 법령 기준)</th><td>${yeonAge}세</td></tr>
    <tr><th>세는 나이 (전통적 나이)</th><td>${seNunAge}세</td></tr>
  `;

  UrlState.sync({ birth: val });
}

attachDateMask('a-birth', recalc);

const urlParams = UrlState.read();
if (urlParams.birth) document.getElementById('a-birth').value = urlParams.birth;

recalc();
