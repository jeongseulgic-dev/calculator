const GRADE_TABLES = {
  '4.5': [['A+',4.5],['A0',4.0],['B+',3.5],['B0',3.0],['C+',2.5],['C0',2.0],['D+',1.5],['D0',1.0],['F',0.0]],
  '4.3': [['A+',4.3],['A0',4.0],['A-',3.7],['B+',3.3],['B0',3.0],['B-',2.7],['C+',2.3],['C0',2.0],['C-',1.7],['D+',1.3],['D0',1.0],['D-',0.7],['F',0.0]]
};

let mode = 'gpa';
let scale = '4.5';

const courseRowsEl = document.getElementById('courseRows');

function fmt2(n){ return n.toLocaleString('ko-KR', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function fmtN(n){ return n.toLocaleString('ko-KR', { maximumFractionDigits:2 }); }

function gradeOptionsHtml(selected){
  return GRADE_TABLES[scale].map(([label]) =>
    `<option value="${label}"${label === selected ? ' selected' : ''}>${label}</option>`
  ).join('');
}

function createCourseRow(name, credit, grade){
  const row = document.createElement('div');
  row.className = 'course-row';
  row.innerHTML = `
    <input type="text" class="course-name" placeholder="과목명" value="${name ? name.replace(/"/g,'&quot;') : ''}">
    <input type="number" class="course-credit" min="0" step="0.5" placeholder="학점" value="${credit != null ? credit : 3}">
    <select class="course-grade">${gradeOptionsHtml(grade || 'A0')}</select>
    <button type="button" class="course-row-remove" aria-label="과목 삭제">×</button>
  `;
  row.querySelector('.course-name').addEventListener('input', recalc);
  row.querySelector('.course-grade').addEventListener('change', recalc);
  row.querySelector('.course-credit').addEventListener('input', recalc);
  row.querySelector('.course-row-remove').addEventListener('click', () => {
    row.remove();
    updateRemoveButtons();
    recalc();
  });
  return row;
}

function updateRemoveButtons(){
  const rows = courseRowsEl.querySelectorAll('.course-row');
  rows.forEach(row => {
    row.querySelector('.course-row-remove').disabled = rows.length <= 1;
  });
}

function addCourseRow(name, credit, grade){
  courseRowsEl.appendChild(createCourseRow(name, credit, grade));
  updateRemoveButtons();
}

function rebuildGradeOptions(){
  courseRowsEl.querySelectorAll('.course-row').forEach(row => {
    const select = row.querySelector('.course-grade');
    const current = select.value;
    const stillValid = GRADE_TABLES[scale].some(([label]) => label === current);
    select.innerHTML = gradeOptionsHtml(stillValid ? current : GRADE_TABLES[scale][0][0]);
  });
}

document.getElementById('addRowBtn').addEventListener('click', () => {
  addCourseRow('', 3, 'A0');
  recalc();
});

document.querySelectorAll('.seg-toggle').forEach(group=>{
  group.querySelectorAll('.seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      group.querySelectorAll('.seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      if (group.dataset.target === 'mode'){
        mode = btn.dataset.value;
        document.querySelectorAll('.mode-field').forEach(f=>{
          f.classList.toggle('hidden', f.dataset.mode !== mode);
        });
      } else if (group.dataset.target === 'scale'){
        scale = btn.dataset.value;
        rebuildGradeOptions();
      }
      recalc();
    });
  });
});

function serializeCourses(){
  return Array.from(courseRowsEl.querySelectorAll('.course-row')).map(row => {
    const name = encodeURIComponent(row.querySelector('.course-name').value.trim());
    const credit = row.querySelector('.course-credit').value;
    const grade = row.querySelector('.course-grade').value;
    return `${name}:${credit}:${grade}`;
  }).join(',');
}

function recalc(){
  const miniScreen = document.getElementById('miniScreen');
  const miniScreenSub = document.getElementById('miniScreenSub');
  const miniScreenLabel = document.getElementById('miniScreenLabel');
  const statBody = document.getElementById('statBody');
  const meta = document.getElementById('page-meta');

  if (mode === 'gpa'){
    miniScreenLabel.textContent = '평점 (GPA)';
    const rows = Array.from(courseRowsEl.querySelectorAll('.course-row'));
    const pointMap = new Map(GRADE_TABLES[scale]);
    let totalPoint = 0, totalCredit = 0, count = 0;
    rows.forEach(row => {
      const grade = row.querySelector('.course-grade').value;
      const credit = parseFloat(row.querySelector('.course-credit').value);
      if (!pointMap.has(grade) || isNaN(credit) || credit <= 0) return;
      totalPoint += pointMap.get(grade) * credit;
      totalCredit += credit;
      count++;
    });

    if (count === 0 || totalCredit === 0){
      miniScreen.textContent = '0.00';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">과목의 등급과 학점을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }

    const gpa = totalPoint / totalCredit;
    miniScreen.textContent = fmt2(gpa);
    miniScreenSub.textContent = `${scale}점 만점 기준`;
    meta.textContent = `과목 ${count}개 · 총 ${fmtN(totalCredit)}학점`;

    statBody.innerHTML = `
      <tr><th>총 이수학점</th><td>${fmtN(totalCredit)}학점</td></tr>
      <tr><th>반영된 과목 수</th><td>${count}개</td></tr>
      <tr class="stat-highlight"><th>평점 (GPA)</th><td>${fmt2(gpa)} / ${scale}</td></tr>
    `;

    UrlState.sync({ mode, scale, courses: serializeCourses() }, URL_DEFAULTS);
  }

  else if (mode === 'plan'){
    miniScreenLabel.textContent = '필요 평점';
    const curGpa = parseFloat(document.getElementById('g-cur-gpa').value);
    const curCredit = parseFloat(document.getElementById('g-cur-credit').value);
    const targetGpa = parseFloat(document.getElementById('g-target-gpa').value);
    const addCredit = parseFloat(document.getElementById('g-add-credit').value);
    const scaleMax = parseFloat(scale);

    if (isNaN(curGpa) || isNaN(curCredit) || isNaN(targetGpa) || isNaN(addCredit) || addCredit <= 0){
      miniScreen.textContent = '0.00';
      miniScreenSub.textContent = '';
      statBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--ink-soft);">현재·목표 평점과 학점을 입력해 주세요</td></tr>';
      meta.textContent = '--';
      return;
    }

    const required = (targetGpa * (curCredit + addCredit) - curGpa * curCredit) / addCredit;
    meta.textContent = `현재 ${fmt2(curGpa)} · 목표 ${fmt2(targetGpa)} · 추가 ${fmtN(addCredit)}학점`;

    let highlightText, subText;
    if (required <= 0){
      highlightText = '이미 달성됨';
      subText = '현재 평점으로 이미 목표를 달성했습니다';
      miniScreen.textContent = '달성';
    } else if (required > scaleMax){
      highlightText = `불가능 (${scale} 만점 초과)`;
      subText = '이 조건으로는 목표 평점에 도달할 수 없습니다';
      miniScreen.textContent = '초과';
    } else {
      highlightText = `${fmt2(required)} / ${scale}`;
      subText = `앞으로 ${fmtN(addCredit)}학점 동안 평균 ${fmt2(required)} 이상 필요`;
      miniScreen.textContent = fmt2(required);
    }
    miniScreenSub.textContent = subText;

    statBody.innerHTML = `
      <tr><th>현재 평점</th><td>${fmt2(curGpa)}</td></tr>
      <tr><th>현재까지 이수학점</th><td>${fmtN(curCredit)}학점</td></tr>
      <tr><th>목표 평점</th><td>${fmt2(targetGpa)}</td></tr>
      <tr><th>앞으로 이수할 학점</th><td>${fmtN(addCredit)}학점</td></tr>
      <tr class="stat-highlight"><th>필요 평점</th><td>${highlightText}</td></tr>
    `;

    UrlState.sync({ mode, scale, curGpa, curCredit, targetGpa, addCredit }, URL_DEFAULTS);
  }
}

const DEFAULT_COURSE_NAMES = ['수학', '역사', '영어'];
const DEFAULT_COURSES = DEFAULT_COURSE_NAMES.map(n => `${encodeURIComponent(n)}:3:A0`).join(',');

const URL_DEFAULTS = {
  mode: toggleDefault('mode'),
  scale: toggleDefault('scale'),
  courses: DEFAULT_COURSES,
  curGpa: document.getElementById('g-cur-gpa').defaultValue,
  curCredit: document.getElementById('g-cur-credit').defaultValue,
  targetGpa: document.getElementById('g-target-gpa').defaultValue,
  addCredit: document.getElementById('g-add-credit').defaultValue
};

DEFAULT_COURSE_NAMES.forEach(name => addCourseRow(name, 3, 'A0'));

const urlParams = UrlState.read();
if (urlParams.scale) clickToggle('scale', urlParams.scale);
if (urlParams.mode) clickToggle('mode', urlParams.mode);
if (urlParams.courses){
  const parsed = urlParams.courses.split(',').map(s => s.split(':')).filter(p => p.length === 3);
  if (parsed.length){
    courseRowsEl.innerHTML = '';
    parsed.forEach(([name, credit, grade]) => addCourseRow(decodeURIComponent(name), credit, grade));
  }
}
const PLAN_FIELD_KEYS = { 'g-cur-gpa':'curGpa', 'g-cur-credit':'curCredit', 'g-target-gpa':'targetGpa', 'g-add-credit':'addCredit' };
Object.keys(PLAN_FIELD_KEYS).forEach(id=>{
  const key = PLAN_FIELD_KEYS[id];
  if (urlParams[key]) document.getElementById(id).value = urlParams[key];
});
document.querySelectorAll('#g-cur-gpa, #g-cur-credit, #g-target-gpa, #g-add-credit').forEach(el=>{
  el.addEventListener('input', recalc);
});

recalc();
