---
name: calculator-info-section
description: 계산기 서브페이지(입력창+결과+설명 섹션+광고 슬롯) 구조를 만들거나 통일할 때 사용. 정본은 loan-calculator.html.
---

# 계산기 서브페이지 스킬

정본: **loan-calculator.html**. 새 페이지/수정 전에 이 파일 구조를 먼저 연다.
사이트 전체 원칙(콘텐츠 작성 규칙, 디자인 톤, 새 페이지 체크리스트)은 `CLAUDE.md` 참고.
공식·기준값·색상은 항상 해당 `*-calc.js`를 읽고 실제 로직 그대로 반영 (지어내지 말 것).

## 페이지 골격

```html
<div class="shell">
  <div>
    <div class="pages-heading"><h2>{{입력 라벨}}</h2></div>
    <aside class="calc-panel">...입력 필드...</aside>
  </div>
  <div>
    <div class="pages-heading"><h2>{{결과 라벨}}</h2></div>
    <section class="receipt-strip">...결과...</section>
  </div>
</div>

<div class="ad-slot"></div>

<section class="info-section">
  <h2>{{계산기 이름}} 안내</h2>
  <!-- info-block × 4 -->
</section>

<div class="ad-slot"></div>
```
- 좌/우 `pages-heading`은 **둘 다 반드시 넣는다** (한쪽만 있으면 박스 상단이 어긋남).
- `.shell`이 없는 페이지(공학용 계산기)는 `.workspace` 섹션 앞뒤로 동일하게 `ad-slot` 2개.

## info-block 4개 (고정 순서) + 선택적 5번째

| # | 아이콘 | 제목 | 내용 |
|---|---|---|---|
| 1 | 💡 | "~란?" / "~ N가지" | 개념. 병렬 항목 2~3개 이상이면 `method-def`로 항목별 분리 |
| 2 | 🧮 | "계산 방식" | `*-calc.js`와 일치하는 공식. 나눗셈은 분수로 |
| 3 | 📊 | "~ 기준표" / "~ 비교" | 연속 범위는 표, 배타적 선택지는 카드 |
| 4 | ❓ | "자주 묻는 질문" | `<details>` 4~5개, 이 계산기 특유의 질문만 |
| 5 (선택) | 🔗 | "출처" | FAQ 뒤. 특정 공식 요율·기준치·학술 공식을 명시할 때만, `.source-list`로 |

공인 출처(정부기관·공인 학회·원 논문 등)가 없고 블로그뿐이면 5번째 블록 자체를 생략한다
(`CLAUDE.md` 콘텐츠 원칙 참고).

**한계(면책) 고지는 필수**: 1번 또는 2번 블록 안에 "참고용 계산 결과이며 실제 값은
개인 상황에 따라 달라질 수 있다"는 취지의 문장을 반드시 넣는다. 별도 블록을 새로
만들지 말고 기존 설명 문장에 자연스럽게 포함시킨다.

```html
<div class="info-block">
  <h3><span class="info-icon">💡</span>{{제목}}</h3>
  <p>...</p>
</div>
```

## 공식 박스

`.formula-box` 단독 사용 금지 — 나눗셈 없어도 항상 `.formula-frac`으로 감싼다 (안 그러면
폰트가 다른 박스와 어긋남). 숫자를 대입해 보는 "예시 계산"(예: "예) 키 170cm...")도
모노스페이스로 따로 두지 않는다 — `.formula-example` 클래스는 폐기됐다, 그냥 일반 `<p>`로
쓴다. 진짜 공식만 `.formula-box`로 승격.

단일 공식:
```html
<div class="formula-box formula-frac">
  <span class="frac-part"><span class="frac-lhs">BMR = 10×몸무게 + 6.25×키 − 5×나이 + 5</span></span>
</div>
```

나눗셈 있는 공식 → 실제 분수:
```html
<div class="formula-box formula-frac">
  <span class="frac-part">
    <span class="frac-lhs">BMI =</span>
    <span class="frac"><span class="num">몸무게(kg)</span><span class="den">키(m)²</span></span>
  </span>
</div>
```

한 박스에 공식 여러 개(A/B, 남/여 등) → `.frac-part`로 각각 감싸고 `.frac-sep`로 구분
(`<br>`로 이어붙이지 말 것). 화면 크기와 무관하게 항상 가로 배치 유지 — 모바일 전용
세로 스택 미디어쿼리 추가 금지:
```html
<div class="formula-box formula-frac">
  <span class="frac-part"><span class="frac-lhs">남성 BMR = ...</span></span>
  <span class="frac-sep"></span>
  <span class="frac-part"><span class="frac-lhs">여성 BMR = ...</span></span>
</div>
```

## 기준표 vs 비교 카드

- **`criteria-table`**: 항목이 한 축 위에서 순서를 이룸 (예: BMI 저체중→정상→과체중→비만). 문장이 들어가는 열은 `text-table` 수정자 필요 (`CLAUDE.md` 참고).
- **`method-compare-grid`**: 서로 대등·배타적인 선택지 비교 (예: 상환방식, 나이셈법,
  과세유형, 활동량 단계). 카드 개수 무관하게 자동 배치, 모바일 1열.
```html
<div class="method-compare-grid">
  <div class="method-compare-card">
    <span class="mc-badge best">{{뱃지}}</span>
    <h4>{{항목명}}</h4>
    <ul><li><span>{{속성}}</span><span>{{값}}</span></li></ul>
  </div>
</div>
```
`mc-badge best`(핑크)는 계산기 UI의 기본 선택값(seg-btn.active 등)과 일치하는 카드에만.

## 병렬 정의 / FAQ

```html
<div class="method-def">
  <h4>① {{항목명}}</h4>
  <p>{{정의 2~3문장}}</p>
</div>

<details class="faq-item">
  <summary>{{질문}}</summary>
  <p class="faq-a">{{답변}}</p>
</details>
```

## 차트(Chart.js) 추가 시 주의

`.shell` 결과 컬럼에 `<canvas>`/Chart.js를 넣는 페이지(대출·예적금 계산기가 정본)는
`.shell > div{ min-width:0 }`와 차트 래퍼(`.chart-box`)의 `position:relative; width:100%`가
반드시 유지돼야 한다. 없으면 캔버스가 처음 렌더링될 때 잡은 픽셀 너비가 그리드 컬럼의
최소 너비로 고정돼, 창을 나중에 좁혀도 그 컬럼(과 캔버스)이 따라 줄어들지 않는 버그가
생긴다 — 모바일처럼 처음부터 좁게 로드하면 안 보이고 PC에서 창을 좁힐 때만 나타나서
발견하기 까다롭다.

## URL 쿼리 상태 동기화 (북마크·공유)

입력값이 있는 서브페이지(카시오 키패드형인 index/공학용 계산기 제외)는 전부 `js/url-state.js`로
입력 상태를 주소창 쿼리에 반영하고, 그 URL로 다시 들어오면 복원한다. 정본은
**salary-calculator.html**(단순, 세그토글 없음)과 **loan-calculator.html**(세그토글+콤마금액+
멀티모드까지 다 있는 가장 복잡한 케이스).

1. `<script src="js/site.js">` 다음, 페이지 자신의 `js/*-calc.js` 앞에 추가:
   ```html
   <script src="js/url-state.js"></script>
   <script src="js/xxx-calc.js"></script>
   ```
2. `*-calc.js`에 `URL_DEFAULTS` 정의. 일반 입력창은 `el.defaultValue`(HTML `value=` 속성)를
   그대로 쓰고, 세그토글은 `toggleDefault('target')`(현재 `.active` 버튼 값)을 쓴다. JS가
   런타임에 강제로 채우는 필드(콤마 포맷 금액 등, HTML엔 `value=` 없음)만 문자열로 하드코딩.
   ```js
   const URL_DEFAULTS = {
     age: document.getElementById('m-age').defaultValue,
     gender: toggleDefault('gender'),
     activity: toggleDefault('activity')
   };
   ```
3. 페이지 초기화부 맨 아래, **기본값 세팅 다음 · 첫 `recalc()` 호출 전**에 URL 복원:
   ```js
   const urlParams = UrlState.read();
   if (urlParams.age) document.getElementById('m-age').value = urlParams.age;
   if (urlParams.gender) clickToggle('gender', urlParams.gender);   // 실제 클릭 → 기존 핸들러 재사용
   recalc();
   ```
   세그토글은 버튼에 값만 대입하지 말고 반드시 `clickToggle()`로 **진짜 클릭**시킨다 —
   그래야 그 토글의 기존 클릭 핸들러(JS 변수 갱신, active 클래스, recalc 호출)를 그대로 타서
   복원 로직을 따로 안 짜도 된다.
4. `recalc()`/`recalcAll()`의 **성공 경로 끝**(에러로 일찍 `return`하는 분기 말고)에 동기화:
   ```js
   UrlState.sync({ age, height, weight, gender, activity }, URL_DEFAULTS);
   ```
   입력마다 개별 리스너를 달지 않는다 — recalc()는 타이핑·퀵버튼(`+100만` 등)·세그토글 클릭이
   전부 수렴하는 지점이라, 여기 한 줄이면 그 셋을 다 잡는다. 콤마 포맷 필드는 recalc() 안에서
   이미 `.replace(/,/g,'')`로 벗긴 숫자 변수를 그대로 넘기면 URL도 자동으로 깨끗해진다
   (`?salary=40000000`, 콤마 인코딩 없이).
5. 모드가 여러 개인 페이지(퍼센트·날짜 계산기처럼 `mode` 세그토글로 필드 세트가 바뀌는 경우)는
   현재 모드에 해당하는 필드만 `sync()`에 넣는다 — 안 쓰는 모드의 필드까지 얹지 않는다.

새 계산기 페이지를 만들 때 이 5단계를 빼먹지 않는다. `clickToggle`/`toggleDefault` 헬퍼는
`js/site.js`에 이미 있다.

## CSS

모든 클래스는 `style.css`의 `서브페이지 설명 섹션` / `광고 슬롯` 블록에 이미 정의돼 있다.
