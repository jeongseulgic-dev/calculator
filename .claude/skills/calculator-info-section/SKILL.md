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

## CSS

모든 클래스는 `style.css`의 `서브페이지 설명 섹션` / `광고 슬롯` 블록에 이미 정의돼 있다.
