# AMS AI-Ready Design System Specification v1.0

> 목적: 이 문서는 원본 저장소에 접근할 수 없는 사람 또는 AI도 현재 AMS의 시각 언어와 구현 방식을 최대한 동일하게 재현하도록 돕는 단일 기준이다. 일반적인 디자인 시스템 이론이 아니라 2026-11-27 기준 실제 Angular/SCSS 구현과 명시적으로 합의된 규칙만 기록한다.

## 0. 문서 상태와 판정 기준

### 0.1 상태 표기

- **[공용 구현]**: 독립된 Angular standalone component 또는 전역 스타일로 재사용 가능하다.
- **[로컬 구현]**: `/design-system` 또는 특정 페이지 안에서 동작하지만 공용 컴포넌트 API로 추출되지 않았다.
- **[합의 규칙]**: 사용자와 명시적으로 합의되어 실제 화면에 반영된 규칙이다.
- **[임시/샘플]**: Mock 데이터 또는 검토용 마크업이다. 제품 정책으로 간주하지 않는다.
- **[미구현]**: 소스에 해당 컴포넌트/패턴이 없다.
- **[미확정]**: 구현 사례는 있으나 전역 정책으로 확정할 근거가 부족하다.

### 0.2 우선순위

충돌 시 다음 순서를 따른다.

1. 명시적으로 합의된 최신 규칙
2. `src/styles/tokens/**`와 전역 base/utilities
3. `/design-system`의 실제 구현
4. App Shell과 Dashboard의 공통 구현
5. 여러 실제 페이지에 반복되는 패턴
6. 개별 세부 메뉴의 일회성 구현

와이어프레임은 요소와 레이아웃 확인용일 뿐이다. 구체적인 색상, 폰트, 간격, 테이블, 카드, 그림자, 상태 표현은 `/design-system`과 이 명세를 따른다.

### 0.3 핵심 소스 맵

- `[C]` `src/styles/tokens/_colors.scss`
- `[T]` `src/styles/tokens/_typography.scss`
- `[S]` `src/styles/tokens/_spacing.scss`
- `[E]` `src/styles/tokens/_effects.scss`
- `[B]` `src/styles/base/`
- `[U]` `src/styles/utilities/`
- `[DS]` `src/app/pages/overview/overview.page.*`
- `[CS]` `src/app/pages/overview/components/component-showcase/component-showcase.component.*`
- `[AS]` `src/app/pages/overview/components/ams-specialized-showcase/ams-specialized-showcase.component.*`
- `[SH]` `src/app/layout/shell/`, `header/`, `sidebar/`
- `[DB]` `src/app/pages/overview/dashboard.page.*`
- `[CH]` `src/app/shared/components/chart/`, `src/app/shared/charts/chart-fill.ts`
- `[SB]` `src/app/shared/components/status-badge/`
- `[GA]` `src/app/shared/components/gauge/`
- `[IC]` `src/app/shared/components/icon/`

### 0.4 구현 프로필

- Angular `19.2.x`, standalone components, Angular Router, Signals(`signal`, `computed`, `input`, `output`).
- Template control flow는 `@if`, `@for`를 사용한다.
- component-scoped SCSS + `src/styles.scss`에서 불러오는 global token/base/utility 구조다.
- Chart.js `^4.6.1`; 별도 UI component library는 없다.
- route page는 대부분 `loadComponent` lazy loading이며 Dashboard/Design System은 eager component다.
- mock-only prototype이므로 backend contract나 persistence를 UI sample에서 추론하지 않는다.

---

## 1. Design Principles

### 1.1 디자인 목표

1. **관리자 작업 중심**: 장식보다 탐색, 비교, 상태 판단, 수정 작업 속도를 우선한다.
2. **데이터 우선 계층**: 페이지 제목 → KPI/요약 → 분석 또는 도구 모음 → 표/세부 데이터 순으로 읽힌다.
3. **높은 정보 밀도, 낮은 시각 소음**: 흰 Surface와 옅은 앱 배경, 제한된 그림자, 4px 간격 체계를 사용한다.
4. **상태는 색과 텍스트로 함께 전달**: 성공/경고/위험/정보 색만으로 의미를 전달하지 않고 배지 레이블을 병행한다.
5. **숫자 가독성**: 수치에는 tabular figures를 사용하고, 표의 숫자 열은 오른쪽 정렬한다.
6. **구성 요소 재사용**: 새 화면은 기존 토큰, App Shell, shared component, 표/폼/다이얼로그 조합을 우선한다.
7. **Desktop-first, responsive fallback**: 넓은 관리자 화면을 기본으로 하되 1099/900/767px App Shell 전환을 보존한다.

### 1.2 시각적 계층

- 앱 배경: `--color-background` `#f9f9fb`.
- 기본 Surface: `--color-surface` `#fff`.
- 카드: **[합의 규칙]** 기본적으로 `border: 0`, `border-radius: 16px`, 그림자 없음.
- Overlay, dropdown, modal만 border와 elevation을 사용한다.
- 제목은 H1 24/700, 섹션 H2 20/700, 카드 H3 16/600, 소제목 H4 14/600을 기본으로 한다.
- 설명은 `--color-text-secondary` 또는 `--color-text-muted`, body-sm/body-lg를 사용한다.
- Primary blue는 핵심 행동, 선택, 일부 강조 KPI에만 사용한다.

### 1.3 반드시 지킬 사항

- 임의 HEX, px, radius, shadow를 추가하지 말고 토큰 또는 이 문서의 검증된 패턴을 사용한다.
- App Shell, Header, Sidebar 구조와 치수를 페이지 작업 때문에 변경하지 않는다.
- 동일 목적에는 동일 컴포넌트와 variant를 사용한다.
- 카드에 관성적으로 테두리나 그림자를 추가하지 않는다.
- 페이지 배경 위 pill control은 `color-mix(in srgb, var(--color-surface-subtle) 55%, var(--color-neutral-100))`, border 0을 우선한다.
- **[합의 규칙]** 상단 기간/필터/구성 및 table toolbar pill은 pointer cursor를 유지하되 단순 hover만으로 색을 바꾸지 않는다. 열린 상태, 선택 상태, 활성 필터는 시각적으로 구분한다.
- **[합의 규칙]** Actions 열의 meatball은 상세/수정 메뉴를 열지 않고 기존 상세 route 또는 상세 dialog를 바로 연다.

---

## 2. Design Tokens

공식 `:root` 토큰은 총 **206개**다(색상 107, typography 40, spacing/layout 24, effects 35). 여기에 component scope의 지역 CSS 변수 11개가 있다. “값”은 정의값이며 alias는 해석된 값도 병기한다.

### 2.1 Brand / Primary / Neutral

| Token | 실제 값 | 목적 | 사용 규칙 | 출처 |
|---|---:|---|---|---|
| `--color-primary-50` | `#f0f8ff` | 가장 옅은 브랜드 배경 | 선택/정보 배경 | [C] |
| `--color-primary-100` | `#e0f1ff` | 옅은 브랜드 배경 | active/subtle hover | [C] |
| `--color-primary-200` | `#b9dfff` | 옅은 브랜드 경계 | active pagination 경계 | [C] |
| `--color-primary-300` | `#80c4ff` | 밝은 브랜드색 | 제한적 강조 | [C] |
| `--color-primary-400` | `#4dadff` | 밝은 브랜드색 | dark sidebar active | [C] |
| `--color-primary-500` | `#2f9aff` | 기본 브랜드색 | primary action, chart | [C] |
| `--color-primary-600` | `#1684eb` | primary hover | 주요 버튼 hover | [C] |
| `--color-primary-700` | `#086bc7` | primary active | 선택 텍스트/링크 hover | [C] |
| `--color-primary-800` | `#07569e` | 진한 브랜드색 | 제한적 KPI icon | [C] |
| `--color-primary-900` | `#0a477d` | 가장 진한 브랜드색 | 특수 강조만 | [C] |
| `--color-neutral-0` | `#ffffff` | white | Surface, inverse text | [C] |
| `--color-neutral-25` | `#fdfdfd` | highlight white | loading highlight | [C] |
| `--color-neutral-50` | `#f9f9fb` | 앱 배경 | background/sunken | [C] |
| `--color-neutral-100` | `#f1f2f4` | 옅은 회색 | subtle/disabled | [C] |
| `--color-neutral-200` | `#e9ebef` | divider | 기본 border | [C] |
| `--color-neutral-300` | `#d8dce2` | strong divider | control border | [C] |
| `--color-neutral-400` | `#a6abb4` | disabled/icon | disabled text | [C] |
| `--color-neutral-500` | `#727883` | muted text | caption/meta | [C] |
| `--color-neutral-600` | `#555b66` | secondary text | 일반 보조 텍스트 | [C] |
| `--color-neutral-700` | `#383d46` | secondary action | dark secondary button | [C] |
| `--color-neutral-800` | `#242830` | secondary hover | dark action hover | [C] |
| `--color-neutral-900` | `#15181e` | primary ink | 제목/본문/검정 icon bg | [C] |

### 2.2 Semantic action, surface, navigation, border, text

| Token | 실제 값 | 목적 | 사용 규칙 | 출처 |
|---|---:|---|---|---|
| `--color-primary` | `#2f9aff` | primary action | 핵심 CTA 1개 우선 | [C] |
| `--color-primary-hover` | `#1684eb` | primary hover | primary button만 | [C] |
| `--color-primary-active` | `#086bc7` | active/selected ink | active tab/link | [C] |
| `--color-primary-subtle` | `#f0f8ff` | selected bg | 선택 행/탭 보조 | [C] |
| `--color-primary-subtle-hover` | `#e0f1ff` | stronger subtle | avatar/highlight | [C] |
| `--color-on-primary` | `#fff` | primary 위 텍스트 | primary surface에서만 | [C] |
| `--color-secondary` | `#383d46` | secondary action | 진한 보조 CTA | [C] |
| `--color-secondary-hover` | `#242830` | secondary hover | secondary button | [C] |
| `--color-secondary-active` | `#15181e` | secondary active | pressed 상태 | [C] |
| `--color-secondary-subtle` | `#f1f2f4` | secondary subtle | 약한 보조 배경 | [C] |
| `--color-on-secondary` | `#fff` | secondary 위 텍스트 | dark secondary에서만 | [C] |
| `--color-background` | `#f9f9fb` | 앱 배경 | 모든 페이지 기반 | [C] |
| `--color-surface` | `#fff` | 기본 카드 | 카드/입력 | [C] |
| `--color-surface-subtle` | `#f9f9fb` | subtle surface | toolbar input/내부 블록 | [C] |
| `--color-surface-sunken` | `#f9f9fb` | recessed surface | table header | [C] |
| `--color-surface-raised` | `#fff` | raised surface | 필요 시 overlay 전 단계 | [C] |
| `--color-surface-overlay` | `#fff` | overlay | dropdown/dialog/toast | [C] |
| `--color-overlay` | `rgb(21 24 30 / 38%)` | scrim | modal/mobile nav 배경 | [C] |
| `--color-sidebar` | `#171a20` | sidebar bg | Sidebar 전용 | [C] |
| `--color-sidebar-ink` | `#f4f6f8` | sidebar text | 기본 nav text | [C] |
| `--color-sidebar-icon` | `#a6abb4` | sidebar icon | 비활성 icon | [C] |
| `--color-sidebar-label` | `#8b919c` | group label | nav group label | [C] |
| `--color-sidebar-control` | `#2c313a` | collapse bg | sidebar control | [C] |
| `--color-sidebar-control-ink` | `#d5d8de` | collapse icon | sidebar control | [C] |
| `--color-sidebar-hover` | `rgb(255 255 255 / 6%)` | nav hover | dark nav hover | [C] |
| `--color-sidebar-selected` | `rgb(47 154 255 / 18%)` | nav selected | active route bg | [C] |
| `--color-sidebar-pressed` | `rgb(255 255 255 / 10%)` | nav pressed | active press | [C] |
| `--color-sidebar-line` | `rgb(255 255 255 / 8%)` | sidebar divider | border/group divider | [C] |
| `--color-sidebar-active` | `#4dadff` | active nav ink | selected route | [C] |
| `--color-sidebar-focus` | `rgb(255 255 255 / 72%)` | dark focus | sidebar focus outline | [C] |
| `--color-border` | `#e9ebef` | 기본 border | controls/overlay | [C] |
| `--color-border-strong` | `#d8dce2` | 강한 border | checkbox/강조 경계 | [C] |
| `--color-border-interactive` | `#d8dce2` | interactive border | 입력 경계용 alias | [C] |
| `--color-divider` | `#e9ebef` | divider | 섹션 내부 구분 | [C] |
| `--color-table-row` | `#eef0f3` | row line | table body divider | [C] |
| `--color-text-primary` | `#15181e` | 주 텍스트 | 제목/핵심값 | [C] |
| `--color-text-secondary` | `#555b66` | 보조 텍스트 | 본문/컨트롤 | [C] |
| `--color-text-muted` | `#727883` | 메타 텍스트 | 설명/날짜 | [C] |
| `--color-text-disabled` | `#a6abb4` | disabled text | disabled/placeholder | [C] |
| `--color-text-inverse` | `#fff` | inverse text | dark/primary bg 위 | [C] |
| `--color-link` | `#1684eb` | link | 텍스트 링크 | [C] |
| `--color-link-hover` | `#086bc7` | link hover | 텍스트 링크 hover | [C] |

### 2.3 Semantic status, interaction, chart

| Token | 실제 값 | 목적 | 사용 규칙 | 출처 |
|---|---:|---|---|---|
| `--color-success` | `#16a36a` | success base | icon/progress | [C] |
| `--color-success-bg` | `#eaf8f1` | success bg | badge/alert | [C] |
| `--color-success-text` | `#117a50` | success text | label | [C] |
| `--color-success-border` | `#bde8d2` | success border | alert | [C] |
| `--color-success-ring` | `rgba(22,163,106,.16)` | success ring | 검증 강조 | [C] |
| `--color-warning` | `#d99016` | warning base | warning icon | [C] |
| `--color-warning-bg` | `#fff6e5` | warning bg | badge/alert | [C] |
| `--color-warning-text` | `#99620a` | warning text | label | [C] |
| `--color-warning-border` | `#f1d39a` | warning border | alert | [C] |
| `--color-danger` | `#dc4c4c` | danger base | destructive CTA | [C] |
| `--color-danger-bg` | `#fff0f0` | danger bg | badge/alert | [C] |
| `--color-danger-text` | `#b83232` | danger text | label/hover | [C] |
| `--color-danger-border` | `#f3c2c2` | danger border | alert | [C] |
| `--color-info` | `#2f9aff` | info base | info icon | [C] |
| `--color-info-bg` | `#f0f8ff` | info bg | badge/alert | [C] |
| `--color-info-text` | `#176fc0` | info text | label | [C] |
| `--color-info-border` | `#b9dfff` | info border | alert | [C] |
| `--color-hover` | `#f1f2f4` | generic hover | menu/dropdown 항목 | [C] |
| `--color-active` | `#e0f1ff` | generic active | pressed/active | [C] |
| `--color-selected` | `#f0f8ff` | selected | 선택 행/항목 | [C] |
| `--color-focus` | `#2f9aff` | focus color | focus outline | [C] |
| `--color-focus-ring` | `rgba(47,154,255,.24)` | focus ring | keyboard focus | [C] |
| `--color-disabled-bg` | `#f1f2f4` | disabled bg | disabled control | [C] |
| `--color-disabled-border` | `#e9ebef` | disabled border | disabled control | [C] |
| `--color-disabled-text` | `#a6abb4` | disabled text | disabled control | [C] |
| `--color-loading-base` | `#f1f2f4` | skeleton base | loading | [C] |
| `--color-loading-highlight` | `#fdfdfd` | skeleton highlight | loading shimmer | [C] |
| `--chart-series-primary` | `#2f9aff` | chart series 1 | 첫 데이터셋 | [C] |
| `--chart-series-secondary` | `#38bdf8` | chart series 2 | 두 번째 데이터셋 | [C] |
| `--chart-series-success` | `#818cf8` | chart series 3 | 세 번째 데이터셋 | [C] |
| `--chart-series-warning` | `#2dd4bf` | chart series 4 | 네 번째 데이터셋 | [C] |
| `--chart-series-muted` | `#d8dce2` | muted series | 기타/비활성 | [C] |
| `--chart-fill-primary` | `rgba(47,154,255,.12)` | area fill | primary area | [C] |
| `--chart-fill-secondary` | `rgba(56,189,248,.16)` | area fill | secondary area | [C] |
| `--chart-fill-success` | `rgba(129,140,248,.16)` | area fill | third area | [C] |
| `--chart-grid` | `rgba(21,24,30,.06)` | chart grid | y-grid 중심 | [C] |
| `--chart-tooltip-bg` | `#15181e` | tooltip bg alias | chart/help tooltip | [C] |

호환 alias도 실제 token이다.

| Token | 실제 값 | 목적 | 사용 규칙 | 출처 |
|---|---:|---|---|---|
| `--color-bg-app` | `#f9f9fb` | app bg compatibility | 신규 코드는 `--color-background` | [C] |
| `--color-bg-sidebar` | `#fff` | legacy sidebar bg | dark Sidebar에는 사용하지 않음 | [C] |
| `--color-bg-surface` | `#fff` | surface compatibility | 신규 코드는 `--color-surface` | [C] |
| `--color-bg-subtle` | `#f9f9fb` | subtle compatibility | 신규 코드는 `--color-surface-subtle` | [C] |
| `--color-bg-hover` | `#f1f2f4` | hover compatibility | 신규 코드는 `--color-hover` | [C] |
| `--color-border-default` | `#e9ebef` | border compatibility | 신규 코드는 `--color-border` | [C] |

신규 코드는 semantic canonical token을 사용하고 alias를 새로 확장하지 않는다.

### 2.4 Typography

| Token | 실제 값 | 목적/규칙 | 출처 |
|---|---:|---|---|
| `--font-family-sans` | `Figtree, 'Figtree Variable', 'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | UI sans stack | [T] |
| `--font-family-data` | `Figtree, 'Figtree Variable', 'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` | 숫자/data stack | [T] |
| `--font-size-display` | `32px` | 대형 display | [T] |
| `--font-size-h1` | `24px` | 페이지 제목 | [T] |
| `--font-size-h2` | `20px` | 섹션 제목 | [T] |
| `--font-size-h3` | `16px` | 카드 제목 | [T] |
| `--font-size-h4` | `14px` | 소제목 | [T] |
| `--font-size-body-lg` | `15px` | 페이지 설명 | [T] |
| `--font-size-body` | `14px` | 기본 body | [T] |
| `--font-size-body-sm` | `13px` | table/control body | [T] |
| `--font-size-label` | `13px` | form label | [T] |
| `--font-size-caption` | `12px` | metadata | [T] |
| `--font-size-micro` | `11px` | table th/badge/helper | [T] |
| `--font-size-numeric` | `14px` | 수치 기본 | [T] |
| `--font-size-kpi` | `32px` | KPI | [T] |
| `--font-size-stat` | `22px` | 보조 통계 | [T] |
| `--font-size-stat-lg` | `28px` | 큰 통계 | [T] |
| `--font-size-brand` | `18px` | sidebar brand | [T] |
| `--font-weight-regular` | `400` | 기본 본문 | [T] |
| `--font-weight-medium` | `500` | label/control | [T] |
| `--font-weight-semibold` | `600` | card/control 강조 | [T] |
| `--font-weight-bold` | `700` | heading/KPI | [T] |
| `--font-weight-extrabold` | `800` | brand | [T] |
| `--line-height-display` | `1.25` | display | [T] |
| `--line-height-h1` | `1.35` | H1 | [T] |
| `--line-height-h2` | `1.4` | H2 | [T] |
| `--line-height-h3` | `1.45` | H3 | [T] |
| `--line-height-h4` | `1.45` | H4 | [T] |
| `--line-height-body-lg` | `1.6` | large body | [T] |
| `--line-height-body` | `1.55` | body | [T] |
| `--line-height-body-sm` | `1.5` | small body | [T] |
| `--line-height-label` | `1.4` | label | [T] |
| `--line-height-caption` | `1.45` | caption | [T] |
| `--line-height-numeric` | `1.4` | numeric | [T] |
| `--letter-spacing-display` | `-0.025em` | display | [T] |
| `--letter-spacing-heading` | `-0.015em` | headings | [T] |
| `--letter-spacing-body` | `0` | body | [T] |
| `--letter-spacing-label` | `0.005em` | label | [T] |
| `--letter-spacing-caption` | `0.01em` | caption/micro | [T] |
| `--font-feature-numeric` | `'tnum' 1, 'lnum' 1, 'zero' 1` | 숫자 정렬 | [T] |

전역 utility는 `.text-display`, `.text-h1`~`.text-h4`, `.text-body-large`, `.text-body`, `.text-body-small`, `.text-label`, `.text-caption`, `.text-micro`, `.text-numeric/.text-data`다 (`src/styles/base/_typography.scss`). 숫자에는 `.text-data`를 우선한다.

### 2.5 Spacing, layout, controls

| Token | 실제 값 | 목적/규칙 | 출처 |
|---|---:|---|---|
| `--space-0` | `0` | zero spacing | [S] |
| `--space-1` | `4px` | 4px grid ×1 | [S] |
| `--space-2` | `8px` | 4px grid ×2 | [S] |
| `--space-3` | `12px` | 4px grid ×3 | [S] |
| `--space-4` | `16px` | 4px grid ×4 | [S] |
| `--space-5` | `20px` | 4px grid ×5 | [S] |
| `--space-6` | `24px` | 4px grid ×6 | [S] |
| `--space-7` | `28px` | 4px grid ×7 | [S] |
| `--space-8` | `32px` | 4px grid ×8 | [S] |
| `--space-9` | `36px` | 4px grid ×9 | [S] |
| `--space-10` | `40px` | 4px grid ×10 | [S] |
| `--space-11` | `44px` | 4px grid ×11 | [S] |
| `--space-12` | `48px` | 4px grid ×12 | [S] |
| `--space-13` | `52px` | 4px grid ×13 | [S] |
| `--space-14` | `56px` | 4px grid ×14 | [S] |
| `--space-15` | `60px` | 4px grid ×15 | [S] |
| `--space-16` | `64px` | 4px grid ×16 | [S] |
| `--sidebar-width-expanded` | `260px` | desktop sidebar | [S] |
| `--sidebar-width-collapsed` | `72px` | compact sidebar | [S] |
| `--header-height` | `64px` | global header/brand | [S] |
| `--page-padding` | `28px` (`--space-7`) | desktop content padding | [S] |
| `--control-height-sm` | `32px` | compact/button/action | [S] |
| `--control-height-md` | `36px` | 기본 button/input/filter | [S] |
| `--control-height-lg` | `40px` | large button | [S] |

### 2.6 Radius, border, elevation, focus, opacity, motion

| Token | 실제 값 | 목적/규칙 | 출처 |
|---|---:|---|---|
| `--radius-small` | `6px` | control/button | [E] |
| `--radius-medium` | `12px` | 내부 panel/dropdown | [E] |
| `--radius-large` | `16px` | card/dialog | [E] |
| `--radius-full` | `999px` | pill/avatar | [E] |
| `--radius-xs` | `4px` | exceptional compact radius | [E] |
| `--radius-sm` | `6px` | `--radius-small` alias | [E] |
| `--radius-md` | `12px` | `--radius-medium` alias | [E] |
| `--radius-lg` | `16px` | `--radius-large` alias | [E] |
| `--radius-xl` | `16px` | compatibility radius | [E] |
| `--border-width` | `1px` | 기본 선 | [E] |
| `--border-style` | `solid` | 기본 선 | [E] |
| `--border-default` | `1px solid #e9ebef` | control/overlay | [E] |
| `--border-strong` | `1px solid #d8dce2` | stronger border | [E] |
| `--divider` | `1px solid #e9ebef` | divider | [E] |
| `--table-row-line` | `1px solid #eef0f3` | table row | [E] |
| `--shadow-subtle` | `0 1px 3px rgba(21,24,30,.035)` | 작은 내부 요소 | [E] |
| `--shadow-card` | `0 4px 14px rgba(21,24,30,.045)` | 토큰은 존재하나 기본 카드에는 사용 금지 | [E] |
| `--shadow-dropdown` | `0 10px 28px rgba(21,24,30,.09)` | dropdown/popover | [E] |
| `--shadow-modal` | `0 20px 48px rgba(21,24,30,.14)` | modal/mobile sidebar | [E] |
| `--shadow-xs` | `var(--shadow-subtle)` → `0 1px 3px rgba(21,24,30,.035)` | compatibility alias | [E] |
| `--shadow-sm` | `var(--shadow-card)` → `0 4px 14px rgba(21,24,30,.045)` | compatibility alias | [E] |
| `--shadow-md` | `var(--shadow-dropdown)` → `0 10px 28px rgba(21,24,30,.09)` | compatibility alias | [E] |
| `--shadow-lg` | `var(--shadow-modal)` → `0 20px 48px rgba(21,24,30,.14)` | compatibility alias | [E] |
| `--focus-ring-width` | `3px` | focus ring | [E] |
| `--focus-ring` | `0 0 0 3px rgba(47,154,255,.24)` | custom focus | [E] |
| `--focus-ring-danger` | `0 0 0 3px rgb(220 76 76 / 24%)` | danger focus | [E] |
| `--focus-ring-success` | `0 0 0 3px rgb(22 163 106 / 24%)` | success focus | [E] |
| `--focus-outline` | `2px solid #2f9aff` | 전역 focus-visible | [E] |
| `--focus-outline-offset` | `2px` | focus offset | [E] |
| `--disabled-opacity` | `0.48` | disabled elements | [E] |
| `--duration-fast` | `120ms` | hover/state 전환 | [E] |
| `--duration-normal` | `180ms` | 일반 전환 | [E] |
| `--duration-slow` | `240ms` | 느린 전환 | [E] |
| `--ease-standard` | `cubic-bezier(0.2,0,0,1)` | 기본 motion | [E] |
| `--ease-emphasized` | `cubic-bezier(0.2,0,0,1.2)` | 강조 motion | [E] |

### 2.7 Breakpoints와 z-index

중앙 토큰은 **없다**. 아래는 실제 구현값이며 임의 확장을 금지한다.

- App Shell canonical: `1099px`(page padding 24, auto-collapsed sidebar), `900px`(off-canvas sidebar + scrim), `767px`(page padding 20px 16px, mobile header), `479px`(좁은 header popover).
- Design System: `1199px`, `767px`; specialized showcase: `1180px`, `900px`, `640px`.
- 실제 페이지에는 `1023/1024`, `1100`, `1199`, `1279`, `1399`가 혼재한다. 신규 breakpoint 도입 전 기존 값으로 해결한다.
- 실제 layer: header `20`, mobile scrim `25`, sidebar `30`, chart/action dropdown `40`, showcase toast `60`, showcase dialog `70`, page dialog `100`, page toast `120`, auto dialog scrollbar `130`.
- **[불일치]** z-index가 토큰화되지 않았고 showcase dialog(70)와 실제 page dialog(100)가 다르다. 승인 없이 새 layer를 만들지 않는다.

### 2.8 Component scope 지역 변수

이 변수는 전역 token이 아니라 해당 component 내부 alias다.

| Token | 실제 값 | 범위/목적 | 출처 |
|---|---|---|---|
| `--side-ink` | `var(--color-sidebar-ink)` | Sidebar text alias | `src/app/layout/sidebar/sidebar.component.scss` |
| `--side-icon` | `var(--color-sidebar-icon)` | Sidebar icon alias | 동일 |
| `--side-label` | `var(--color-sidebar-label)` | Sidebar group label | 동일 |
| `--side-hover` | `var(--color-sidebar-hover)` | Sidebar hover | 동일 |
| `--side-selected` | `var(--color-sidebar-selected)` | Sidebar selected | 동일 |
| `--side-pressed` | `var(--color-sidebar-pressed)` | Sidebar pressed | 동일 |
| `--side-line` | `var(--color-sidebar-line)` | Sidebar divider | 동일 |
| `--side-active` | `var(--color-sidebar-active)` | Sidebar active | 동일 |
| `--alert-tone` | 기본 `var(--color-info)` | Alert semantic foreground | `[CS]` |
| `--alert-bg` | 기본 `var(--color-info-bg)` | Alert semantic background | `[CS]` |
| `--alert-border` | 기본 `var(--color-info-border)` | Alert semantic border | `[CS]` |

`--alert-*`는 success/warning/danger modifier에서 대응 semantic token으로 override된다. `--gauge-value-font-size`, `--gauge-label-font-size`는 선언된 token이 아니라 Gauge가 fallback과 함께 소비하는 component override slot이다.

---

## 3. Application Shell & Layout

### 3.1 구조

```text
.shell
├─ app-sidebar (fixed)
├─ .shell__main
│  ├─ app-header (sticky)
│  └─ main.shell__content
│     └─ .shell__content-inner
│        └─ router-outlet
└─ .shell__scrim (mobile only)
```

출처: `src/app/layout/shell/shell.component.html|scss`.

### 3.2 Sidebar

- Expanded `260px`, collapsed `72px`, fixed full viewport, z 30, dark `#171a20`.
- Brand row는 header와 같은 `64px`.
- Navigation scroll area: `padding: 20px 8px 8px 16px`.
- Group label 28px, caption 12/600. Item 32px high, radius 10px, icon 16px.
- Hover `rgba(255,255,255,.06)`, active `rgba(47,154,255,.18)` + `#4dadff`.
- Collapsed에서 label을 숨기고 icon을 중앙 정렬한다.
- 1099~901px는 강제 compact, 900px 이하 off-canvas, open 시 expanded 260px.
- 구성은 `NAV_GROUPS`만 수정한다. 임의 메뉴 마크업을 Sidebar에 직접 추가하지 않는다.
- 그룹: Overview, Customer Management, Product Management, AI Operations, Administration, System.

### 3.3 Header

- Sticky top 0, z 20, height 64px, desktop horizontal padding 28px.
- 좌측: mobile menu + route-aware breadcrumb. 우측: global menu search(240px), notification, divider, profile.
- Search/control 기본 높이 36px, pill radius, background subtle.
- Search 결과 360px dropdown, profile 240px, notification 320px; `--shadow-dropdown`.
- Ctrl/Cmd+K로 검색 focus, Escape로 검색/메뉴 닫기.
- 1099px 이하 padding 24px/search 200px/profile copy hidden.
- 900px 이하 menu button 표시. 767px 이하 검색은 icon에서 fixed input으로 확장.
- Breadcrumb는 detail context를 `PageContextService`와 query preservation으로 구성한다. 페이지가 독자적인 global breadcrumb를 만들지 않는다.

### 3.4 Main content

- `.shell__content`: flex 1, desktop padding 28px.
- `.shell__content-inner`: width 100%, max-width 1600px, centered.
- 1099px 이하 padding 24px, 767px 이하 `20px 16px`.
- page root는 `width:100%; min-width:0`.
- 기본 page header는 flex, start alignment, `gap:24px`, `margin-bottom:20px`.
- Page title H1, title-description gap 4px. Description은 15px/1.6.
- page actions는 우측 정렬, `gap:8px`; 모바일에서는 header를 grid/stack으로 전환한다.

### 3.5 Grid와 scroll

- KPI: `repeat(auto-fit, minmax(min(100%,240px),1fr))`, gap 12px.
- 일반 card grid: 2~4열, gap 16px; 1279/1199 이하 축소, 767 이하 1열.
- Dashboard 분석 grid: wide `1.55fr` + `minmax(360~380px,1fr)`.
- Table은 card가 overflow hidden, 내부 `.table-scroll`만 `overflow-x:auto`.
- Dialog는 viewport를 넘지 않게 `max-height: min(780px, calc(100dvh - 48px))`; header/footer 고정, body만 scroll.
- App Shell 또는 body 전체에 별도 수평 스크롤을 만들지 않는다.

---

## 4. Spacing & Alignment System

| 관계 | 표준 |
|---|---|
| 페이지 외부 | Shell desktop 28px; medium 24px; mobile 20px 16px |
| Page header → content | 20px (`--space-5`) |
| Dashboard section 사이 | 32px (`--space-8`) |
| Section heading → content | 16px (`--space-4`) |
| 카드 사이 | 기본 16px; KPI 12px |
| 기본 카드 내부 | 20px (`--space-5`) |
| KPI 카드 내부 | 16px (`--space-4`) |
| 카드 제목 → 설명 | 2~3px; title block → content 16px |
| 제목 → 페이지 설명 | 4px |
| Label → input/helper | 6px |
| Form field 사이 | 16px dialog, 20px showcase form |
| 버튼/toolbar item 사이 | 8px; 복잡한 toolbar group 12px |
| Table toolbar | 최소 60~64px, 12px 16px |
| Table cell | actual list `11px 16px`; numeric right |
| Table wrap | 좌우 16px, 하단 12px |
| Pagination footer | 최소 54px, 12px 16px |
| Dialog header/body | 20px |
| Dialog footer | 16px 20px, button gap 8px |
| Icon ↔ text | 6~8px |
| Badge dot ↔ label | 6px |

4px grid 밖의 기존 값(2,3,6,10,11,14px)은 해당 컴포넌트의 검증된 미세 조정이다. 새 목적에 복제하지 말고 가장 가까운 spacing token을 사용한다.

---

## 5. Component Specification

### 5.1 공용 Angular components

#### Icon — [공용 구현]

- Source: `src/app/shared/components/icon/icon.component.*`
- Selector/API: `<app-icon [name]="UiIcon" [size]="20" />`
- 목적: navigation/action/status용 inline SVG. Host는 `inline-flex`.
- 이름: navigation icon 전체 + `menu`, `collapse`, `search`, `bell`, chevrons, `close`, `command`, `calendar`, `filter`, `sliders`, arrows, `sort`, `more`, `info`, `eye`, `eye-off`, `plus`.
- 접근성: 장식 icon은 부모의 accessible name을 사용한다. icon-only button에는 반드시 `aria-label`/`title`.
- Do: 기존 icon name 재사용. Don't: 같은 의미의 외부 icon library 추가.

```html
<button type="button" class="icon-action" aria-label="Product 상세">
  <app-icon name="more" [size]="16" />
</button>
```

#### Status Badge — [공용 구현]

- Source: `src/app/shared/components/status-badge/status-badge.component.*`
- Inputs: required `label: string`, `tone: success|warning|danger|info|neutral`(default neutral), `showDot: boolean`(default true).
- Anatomy: 24px minimum pill, optional 6px dot, text.
- Visual: padding 3px 8px, gap 6px, radius full, micro 11/500, border 0.
- 상태: semantic bg/text pair. 별도 hover 없음.
- 접근성: 색과 함께 label 제공. dot는 `aria-hidden`.

```html
<app-status-badge label="활성" tone="success" />
<app-status-badge label="안정" tone="success" [showDot]="false" />
```

#### Chart — [공용 구현]

- Source: `src/app/shared/components/chart/chart.component.*`, `src/styles/base/_chart-tooltip.scss`.
- Inputs: required `type: ChartType`, required `data: ChartData`, `options`, `plugins`, `height=280`, `label='데이터 차트'`.
- Angular lifecycle에서 Chart.js 생성/갱신/파기. CSS variable을 실제 색으로 resolve한다.
- `canvas role="img"` + `aria-label`. 데이터 표 대체는 아직 미구현.
- 외부 tooltip은 body에 생성되고 scroll 시 숨김. prefers-reduced-motion이면 animation 0.

```ts
import { ChartData, ChartOptions } from 'chart.js';
import { ChartComponent } from '../../shared/components/chart/chart.component';

readonly data: ChartData<'line'> = {
  labels: ['Mon', 'Tue'],
  datasets: [{ label: 'Requests', data: [38, 44], borderColor: 'var(--chart-series-primary)', pointRadius: 0 }]
};
readonly options: ChartOptions<'line'> = { responsive: true, maintainAspectRatio: false };
```

```html
<app-chart type="line" [data]="data" [options]="options" [height]="240" label="일별 요청량" />
```

#### Gauge — [공용 구현]

- Source: `src/app/shared/components/gauge/gauge.component.*`.
- Inputs: required `value:number`(0~100 clamp), `label:string`.
- 13개 notch 반원 게이지, 900ms animation, reduced-motion 즉시 반영.
- 크기: max 340px; value 32px 기본. 필요 시 host에서 `--gauge-value-font-size`, `--gauge-label-font-size` override.
- 접근성: SVG `role=img`, label + 원본 value.
- **[불일치]** notch 색이 `#2F78F6`, `#D9ECFF`, `#F3F5F8`로 hardcoded. 새 게이지 색을 임의로 추가하지 않는다.

#### App Shell / Header / Sidebar — [공용 구현]

- Source: `src/app/layout/**`.
- Inputs/outputs: Sidebar `collapsed`, `mobileOpen`, `collapseToggle`, `navigationSelect`; Header `menuToggle`.
- Usage: routes are Shell children. 신규 페이지가 Shell을 직접 중첩하거나 복제하지 않는다.

### 5.2 Navigation components

| Component | 상태/출처 | 구조와 규칙 |
|---|---|---|
| Sidebar Navigation | 공용, `[SH]` | group label + 32px nav items; expanded/collapsed/mobile variants; routerLinkActive |
| Global Header | 공용, `[SH]` | breadcrumb, global search, notifications, profile |
| Tabs | 로컬 반복, `[CS]`, plans/providers/usage/admin SCSS | 44px page tab(실제 페이지), active primary text + 2px underline; `role=tablist/tab`, `aria-selected` |
| Breadcrumb | Header 공용 + showcase sample | 전역 header가 route context를 생성. 페이지 내부 중복 금지 |
| Pagination | 로컬 반복 | 30x30, 3px gap, 6px radius, active primary-subtle, disabled opacity .4 |
| Dropdown Menu | 로컬, `[CS]` | overlay surface, 6~8px padding, 32~34px items, danger text variant |
| Stepper | 로컬 sample, `[CS]` | 4-column, complete/current states. 제품 flow 표준으로 확정되지 않음 |

Tabs keyboard arrow/Home/End 처리는 showcase에만 구현되어 있다. 실제 page tabs는 click 중심이므로 전역 keyboard policy는 **미확정**이다.

### 5.3 Actions

#### Button — [로컬 구현, 기준 스타일]

- Source: `[CS] .ds-button*`; `[DS] .button*`; 실제 페이지에도 `.button`.
- Anatomy: optional leading/trailing icon + label + optional spinner.
- Variants: primary, secondary, outline, ghost, danger.
- Sizes: small 32px, medium 36px, large 40px.
- Visual: radius 6px, body-sm/600, horizontal padding 12px(large 16px).
- States: default, hover, active(1px down for primary), disabled(global opacity .48), loading.
- Rule: 페이지 주요 CTA는 primary. 취소는 ghost/secondary. 파괴 작업은 danger + confirm.
- **[불일치]** `.ds-button`은 공용 component가 아니며 실제 페이지 `.button` 구현이 중복된다.

#### Icon Button

- 36x36 일반, 32x32 table action. icon-only는 accessible name 필수.
- Table Actions meatball은 **직접 상세 진입**. 목록 popup menu를 만들지 않는다.
- Header notification/profile 등 고유 interaction은 예외다.

#### Checkbox / Radio

- 전역 `[B] _controls.scss`: 16x16, custom glyph, radius 4px / full.
- checked primary blue + white mark. hover border primary. disabled는 global opacity.
- **[접근성 불일치]** focus box-shadow/outline이 제거되어 keyboard 표시가 부족하다. 신규 화면에서 더 제거하지 말고 시스템 개선 전까지 native label association을 필수로 한다.

#### Switch

- `[CS]` local: 36x20, thumb 14, on primary, thumb translate 16px.
- `role="switch"`, `aria-checked` 필수.
- 독립 shared component는 미구현.

### 5.4 Data Entry

| Component | 구현 | Source | 핵심 규칙 |
|---|---|---|---|
| Text Input | local/global native | `[CS]` form section | 36px, padding 0 12px, 1px border, radius 6px, body-sm |
| Search Input | 반복 패턴 | `[CS]`, `[DS]`, `[SH]` header | pill 36px, subtle bg, leading 26~28px white icon bubble, left padding 40~42px |
| Password Input | showcase local | `[CS]` | trailing 28px visibility button + accessible name |
| Select | native local | `[CS]`, 실제 page forms | input과 같은 36px 또는 toolbar pill |
| Multi Select | showcase local | `[CS]` | trigger + checkbox dropdown. 공용 API 미구현 |
| Textarea | showcase/page local | `[CS]`, 실제 dialog forms | min/example 84px, 10px vertical padding, vertical resize |
| Date Picker | native `input[type=date]` | `[CS]` | 36px input |
| Date Range | local | `[CS]`, usage/activity pages | 두 date input + dash, start ≤ end validation |
| Form Field | local | `[CS] .ds-field`, 실제 page `.field` | label 13/500, 6px gap, optional micro helper |
| Validation | local | `[CS] .ds-field--error/--success` | danger/success border + helper text + `aria-invalid`; validation timing 미확정 |

Do: label과 control을 연결하고 helper/error를 텍스트로 제공한다. Don't: placeholder를 label 대용으로 사용하지 않는다.

### 5.5 Data Display

| Component | 구현/Variant | Source | 규칙 |
|---|---|---|---|
| Card | local pattern | `[CS]` cards, `[DS]`, `[DB]` | basic/info/stat/chart/profile; 기본 surface, 16px radius, no default shadow |
| KPI Card | Dashboard/DS local | `[DS]`, `[DB]` | min 140px, padding 16px, icon 40px circle, value 32/700; primary gradient variant |
| Status Indicator | shared | `[SB]` | semantic tone + text |
| Table | local repeated | `[CS]`, `[DS]`, list page SCSS | 자세한 규칙은 §6 |
| Tooltip | chart shared + help local | `[CH]`, `[CS]` | dark overlay; help tooltip hover/focus |
| Avatar | local | `[CS]` Additional UI | 42px single, 32px group, full radius, overlap -8px |
| Divider | global `.u-divider` | `src/styles/utilities/_states.scss` | 1px `--color-divider`; 관련 그룹 사이만 |
| Progress | local | `[CS]`, `[AS]` | 6px track, neutral-100, primary fill, full radius |
| Sparkline | local SVG | `[CS]` Cards/Charts | no fill, primary stroke 2px, rounded line |
| Provider/Model Card | specialized local | `[AS]` | provider header + status, model metadata, connection footer |
| Token/Cost Cards | specialized local | `[AS]` | total/input/output/cost, breakdown, budget progress/comparison |
| Health Card | specialized local | `[AS]`, monitoring page | overall health + error/uptime + service cards |
| Permission Matrix | local page/specialized | `[AS]`, `src/app/pages/admin/permission-matrix.component.*` | account selector + preset + checkbox groups |

### 5.6 Feedback & Overlay

| Component | 구현 | Source | 규칙 |
|---|---|---|---|
| Dialog | local repeated + global scrollbar | `[CS]`, actual page SCSS, `src/styles/base/_dialog.scss` | backdrop overlay, actual pages z100, 16px radius, modal shadow |
| Detail Dialog | showcase/local repeated | `[CS]` | max 720px, max-height viewport-48, sticky regions, scroll body |
| Confirm Dialog | local | `[CS]`, actual page templates | `role=alertdialog` 권장, danger icon, 명확한 취소/파괴 CTA |
| Popover | Header/DS local | `[SH]` header, `[DS]` | anchor-relative, surface overlay, border, dropdown shadow |
| Toast | local repeated | `[CS]`, page SCSS | bottom-right 24px, status text, page z120; 공용 service 미구현 |
| Alert | showcase local | `[CS]` | info/success/warning/danger, role alert, icon+title+text+close |
| Loading Spinner | global `.spinner` | `src/styles/utilities/_states.scss` | 20px; small local 14px; reduced motion |
| Skeleton | global `.skeleton` | `src/styles/utilities/_states.scss` | loading base/highlight shimmer; reduced motion |
| Empty State | local | `[CS]`, list/detail templates | centered icon/illustration + title + remediation text |
| Error State | partial | `[CS]` form validation, detail not-found templates | form validation과 일부 “찾을 수 없음”만. 공용 page error 미구현 |
| Drawer | 부분 구현 | `src/app/layout/sidebar/`, `shell/` | 독립/shared Drawer와 `/design-system` specimen은 없지만 900px 이하 Sidebar가 260px off-canvas mobile navigation drawer로 동작 |

Dialog open 시 backdrop click/Escape close 사례는 있으나 focus trap, initial focus, focus return, body scroll lock은 표준 구현이 없다. 접근성 완성으로 오인하지 않는다.

### 5.7 `/design-system` 전시 항목 전체 대조

`ComponentShowcaseComponent.anchors` 16개를 기준으로 **16/16 문서화**했다.

1. Typography
2. Buttons
3. Forms
4. Badges & Status
5. Cards
6. Tables
7. Charts
8. Navigation
9. Feedback
10. Additional UI
11. AI Token & Cost
12. Provider & Model
13. Provider Pricing Table
14. Permission Management
15. System Monitoring
16. Activity & Logs

이 중 실제 shared component는 Icon, StatusBadge, Chart, Gauge다. 나머지는 대부분 showcase-local 또는 page-local 조합이며 “등록되어 있으므로 import 가능한 컴포넌트”가 아니다.

---

## 6. Table & Data Management Patterns

### 6.1 표준 구조와 순서

```text
Page header
→ optional tabs
→ optional summary/KPI cards
→ table-card
   → toolbar: title/count | search → filters → sort/page-size → primary add
   → optional active-filter/meta row
   → horizontal scroll wrapper
   → table
   → centered pagination footer
```

검색, 필터, 추가 버튼을 테이블 밖에 흩어놓지 않는다. 제목/개수는 왼쪽, 실행 도구는 오른쪽이며 좁은 화면에서 wrap/stack한다.

### 6.2 Table visual

- Card: white, radius 16px, overflow hidden, border/shadow 없음.
- Inner wrap: horizontal padding 16px, bottom 12px.
- Table: width 100%, `border-collapse: separate`, body-sm 13px.
- 실제 목록 표준 th/td: `padding: 11px 16px`.
- Header: 56px, sunken bg, muted micro 11/600, letter spacing .035em, uppercase.
- Header bottom은 8px transparent separator. 첫/마지막 header는 radius 12px.
- Body: secondary text, row divider `#eef0f3`; strong cell은 primary/600.
- Numeric: `.numeric`, right aligned, `.text-data`.
- Action column: centered, width 약 64~88px.
- Hover: `#fcfcfd`. Selected: primary-subtle.
- 긴 텍스트: fixed-layout 페이지는 ellipsis; 식별자/중요 이름에는 title 또는 detail navigation 제공.
- 수평 overflow는 `.data-table-wrap/.table-scroll`에서만 처리하고 table에 적절한 `min-width`를 준다.

### 6.3 Sorting / filtering / search

- Sortable th는 button 전체로 구성하고 arrow icon을 표시한다.
- 검색 입력 즉시 query/page 1 갱신 패턴이 반복된다.
- filter는 native select 또는 pill dropdown을 사용한다.
- URL query parameter로 tab/filter/sort/page 상태를 유지하는 실제 페이지가 다수다.
- 활성 필터는 primary-subtle/count로 표시하고 reset 경로를 제공한다.

### 6.4 Row action

- 행/이름 클릭은 detail route 또는 detail dialog.
- button/a 클릭은 row handler가 무시하도록 `closest('a, button')` guard를 둔다.
- **[합의 규칙]** Actions meatball 클릭은 popup 없이 해당 행의 기존 상세로 직접 이동/오픈한다.
- 별도 상세가 없는 Plans/Policies는 현재 기존 record dialog를 연다. 읽기 전용 상세 정책은 미확정이다.

### 6.5 Pagination / states

- 30x30, gap 3px, radius 6px. active/hover primary-subtle + primary-200 border.
- disabled opacity .4 또는 global .48.
- Empty: table colspan 전체를 사용하고 조건 불일치와 데이터 없음 메시지를 구분한다.
- Loading: spinner/skeleton primitive는 있으나 모든 실제 table에 일관된 loading state는 미구현.
- `.table-loading` 스타일은 `[CS]` SCSS에 존재하지만 대응 HTML specimen은 없어 dead/partial style이다.
- Error: 공용 table error state 미구현.

---

## 7. Data Visualization Guidelines

### 7.1 기술

- `chart.js ^4.6.1`, `Chart.register(...registerables)`.
- 공용 wrapper: `ChartComponent`.
- 공용 fill/plugin: `areaFade`, `barGradientPlugin`.
- 실제 유형: line, area(line+fill), bar, horizontal bar, stacked bar, doughnut, SVG sparkline/progress, custom Gauge.

### 7.2 공통 설정

- `responsive:true`, `maintainAspectRatio:false`.
- line interaction: `mode:'index'`, `intersect:false`.
- line width 2, `pointRadius:0`, hover radius 3~4, tension `.42`.
- X grid 숨김, axis border 숨김. Y grid `--chart-grid`, max ticks 대체로 4.
- Axis tick: muted, 10~11px; numeric font는 data family.
- Legend: 필요할 때 end/right/bottom, pointStyle circle, box 6~8px, 11~13px.
- Doughnut: cutout 56~62%, white border 3px, hoverOffset 3.
- Bar: radius 8~10px, `borderSkipped:false`, max thickness 46~84.
- 실제 `/overview` Dashboard: trend line 256px, Provider doughnut 248px, Gauge max 340px.
- `/design-system` 상단 예시: line 190/284px, cost charts 250px. Showcase chart specimen은 180px.
- 카드 padding 20px, header margin-bottom 16px.

### 7.3 Tooltip

- Chart.js native tooltip은 disabled되고 `ChartComponent` external tooltip을 사용한다.
- fixed z40, min 176/max 280, padding 12px 14px 10px, bg `#1c2129`, radius 14px.
- title 13/600, row 12px, dot 8px, numeric right aligned.
- `MM/DD` title은 `M월 D일`로 변환한다.
- scroll 시 숨기고 viewport 좌우 8px 안에 clamp한다.
- 페이지별 Chart.js option의 tooltip `backgroundColor`, `padding`, `cornerRadius`는 external tooltip 외형에 적용되지 않는다. `callbacks.label`만 콘텐츠 생성에 사용된다.

### 7.4 Formatting

- Count: `Intl.NumberFormat('ko-KR')`.
- Compact: `Intl.NumberFormat('en-US',{notation:'compact', maximumFractionDigits:1})`.
- USD: `Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2})`.
- Percent: 실제 페이지 helper를 재사용하고 단위 `%`를 명시한다.
- Date/time: 현재 `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`, `MM/DD`가 혼재. locale 전역 정책은 **미확정**.
- Missing value는 em dash `—`.

### 7.5 상태

- hover는 Chart.js data hover와 external tooltip.
- reduced-motion이면 chart animation 0, gauge 즉시, skeleton/spinner animation 없음.
- 차트 loading/empty/error 전용 공용 component는 미구현. 데이터 없음 시 차트를 렌더링하지 말고 기존 inline empty pattern을 조합한다.
- `--chart-series-success`는 실제 보라색(`#818cf8`), `--chart-series-warning`은 청록색(`#2dd4bf`)이므로 상태 semantic 색으로 사용하지 않는다.

---

## 8. Page Patterns

### 8.1 Dashboard Page — [확정]

- Page header(제목/설명/updated 또는 actions)
- KPI grid
- 32px section rhythm
- section heading → range controls → trend/card/table 조합
- 카드 border/shadow 없음, radius 16px
- 구현 기준: `[DB]`, 차트는 `[CH]`

### 8.2 List Page — [반복 구현, 사실상 표준]

- Page header + primary add
- optional tabs/summary
- table card(toolbar/search/filter/add → table → pagination)
- row/detail navigation, query state preservation
- 구현 예: Organizations, Users, Products, Providers.

### 8.3 Detail Page / Detail with Tabs — [반복 구현]

- Header breadcrumb는 global Header
- 페이지 내부: back/list action, entity title/status/actions, summary/info
- tab detail은 Overview → related entities → History 순서
- 위험 작업은 confirm dialog.
- 구현 예: Organization, User, Product, Provider detail.

### 8.4 Management Page — [반복 구현]

- Tabs + summary/list 또는 selector/editor split layout.
- 구현 예: Plans & Points, Admin & Permissions, Settings.
- Permission 세부 정책과 일부 메뉴 내용은 샘플/미확정.

### 8.5 Analytics Page — [부분 확정]

- global filter bar → KPI → charts → breakdown table.
- 구현 예: Usage & Costs, Dashboard.
- 데이터 refresh/loading/error contract는 미확정.

### 8.6 Monitoring Page — [부분 확정]

- Health/Logs/Incidents tabs, status summary, service cards 또는 log tables, detail dialogs.
- 구현: System Monitoring.
- uptime chart 등 draft planned section과 실제 모델이 일치하지 않는 항목은 확정 기능이 아니다.

### 8.7 Create/Edit Dialog — [반복 구현]

- Backdrop → dialog header(title/description/close) → scroll body form → footer 취소/저장.
- 1~2 column form, mobile 1 column.
- Edit와 create는 동일 form 구조를 재사용.
- focus trap/return은 미구현.

### 8.8 Authentication Page — [미구현]

로그인, 비밀번호 재설정, MFA 등의 route/component가 없다. App Shell 밖 인증 layout을 추측해 구현하지 말고 별도 승인을 받는다.

### 8.9 구현 조합 예시

List page의 최소 구조:

```html
<section class="page">
  <header class="page__header">
    <div><h1 class="page__title">Products</h1><p class="page__description">제품을 관리합니다.</p></div>
    <button class="button button--primary" type="button">Product 추가</button>
  </header>
  <section class="table-card">
    <header class="table-toolbar">
      <div class="table-title"><strong>Products</strong><span>{{ rows().length }}개 항목</span></div>
      <div class="table-tools"><!-- search → filters → add --></div>
    </header>
    <div class="data-table-wrap"><table class="data-table"><!-- thead/tbody --></table></div>
    <footer class="table-footer"><nav class="pagination" aria-label="페이지"><!-- buttons --></nav></footer>
  </section>
</section>
```

Analytics card의 최소 구조:

```html
<section class="dashboard-section" aria-labelledby="usage-title">
  <header class="section-heading"><div><h2 id="usage-title">사용량</h2><p>기간별 요청량입니다.</p></div></header>
  <article class="panel">
    <header class="panel__header"><div><h3>Requests Trend</h3><p>전체 Product</p></div></header>
    <app-chart type="line" [data]="data" [options]="options" [height]="250" label="기간별 요청량 추이" />
  </article>
</section>
```

이 예시의 class는 공용 Angular component가 아니라 검증된 page pattern이다. 대상 페이지의 기존 SCSS를 확인하고 중복 전역 API로 오인하지 않는다.

---

## 9. Interaction & UX Rules

### 9.1 확정/구현된 규칙

- Router navigation과 query parameters로 목록 상태를 보존한다.
- 현재 route는 Sidebar active와 Header breadcrumb에 반영한다.
- Page tabs는 query param으로 전환하는 실제 사례가 많다.
- Escape는 Header menus, Design System overlays/dialogs를 닫는다.
- backdrop click으로 dialog를 닫는 사례가 있다.
- 필수 입력은 label 옆 `*`/`em`을 사용하는 실제 페이지가 있다.
- 저장 성공은 toast 또는 inline status. 실패는 form error.
- 삭제/비활성화 등 위험 작업은 confirm dialog.
- disabled는 cursor not-allowed + opacity .48.
- reduced-motion을 spinner/skeleton/chart/gauge/sidebar가 일부 지원한다.
- keyboard focus는 전역 `:focus-visible` 2px primary outline을 기본으로 한다.

### 9.2 미확정 또는 불완전

- Dialog focus trap, focus return, initial focus.
- Mobile navigation drawer의 Escape close, focus trap, body scroll lock, background inert, trigger `aria-expanded`.
- Header popover의 outside-click close와 menu keyboard navigation.
- 모든 tabs의 arrow-key navigation.
- loading/error retry의 전역 contract.
- debounce 기준과 server-side filtering.
- toast 위치/색상/수명 전역 service.
- 날짜/시간 locale/timezone 표준.
- form validation 시점(on blur/on submit)과 서버 오류 배치.
- unsaved changes는 Settings canDeactivate 사례만 있으며 전역 정책은 아니다.

---

## 10. AI Implementation Rules

1. 기존 디자인 토큰을 우선 사용한다.
2. 기존 UI 컴포넌트가 존재하면 새 컴포넌트를 만들지 않고 재사용한다.
3. 공통 Header, Sidebar, App Shell을 임의로 변경하지 않는다.
4. 기존 Spacing, Typography, Color, Radius 규칙을 유지한다.
5. 동일한 목적의 UI에는 동일한 컴포넌트와 variant를 적용한다.
6. 임의의 색상, 여백, 스타일 또는 디자인 패턴을 추가하지 않는다.
7. 새로운 화면만을 위한 별도 디자인 시스템을 만들지 않는다.
8. 실제 component와 source를 먼저 확인한다. Design System 데모가 import 가능한 shared component라고 가정하지 않는다.
9. 없는 컴포넌트는 기존 primitive 조합 가능성을 먼저 검토한다.
10. 디자인 시스템 변경이 필요하면 이유, token/API 제안, 기존 화면 영향 범위를 제시하고 승인받는다.
11. 임시/샘플/미확정 규칙을 확정 정책처럼 구현하지 않는다.
12. 완료 전 §11 체크리스트로 검증한다.
13. 새 페이지 route는 기존 Shell child로 추가하고 `NAV_GROUPS`와 breadcrumb 영향을 확인한다.
14. Card는 기본 border 0 / shadow none / radius 16px다.
15. Table Actions meatball은 기존 상세로 직접 연결한다.
16. source에 hardcoded legacy 색이 있어도 새 코드에서 복제하지 말고 semantic token을 사용한다.
17. 기능 구현 후 build/lint와 실제 브라우저에서 desktop/mobile, hover/focus/disabled/empty를 확인한다.

---

## 11. Design System Compliance Checklist

### 작업 전

- [ ] `/design-system`과 이 문서를 확인했는가?
- [ ] shared component와 유사한 기존 page pattern을 검색했는가?
- [ ] 구현 대상이 확정 규칙인지 샘플/미확정인지 구분했는가?
- [ ] App Shell이나 token 변경이 정말 필요한지 검토했는가?

### 구조

- [ ] 기존 App Shell/Header/Sidebar를 유지했는가?
- [ ] page header/title/description/actions 구조가 기존 패턴과 같은가?
- [ ] content max-width 1600px와 responsive padding을 훼손하지 않았는가?
- [ ] mobile에서 grid/toolbar/table/dialog가 안전하게 축소되는가?

### 토큰과 시각

- [ ] 정의된 semantic token만 사용했는가?
- [ ] 4px spacing scale를 우선했는가?
- [ ] 카드가 기본 border 0, shadow none, radius 16px인가?
- [ ] 버튼/입력 높이가 32/36/40px 규칙에 맞는가?
- [ ] typography와 numeric tabular style이 맞는가?
- [ ] 임의 HEX, shadow, radius, z-index, breakpoint를 추가하지 않았는가?

### Component

- [ ] 기존 Icon/StatusBadge/Chart/Gauge를 재사용했는가?
- [ ] 같은 목적에 같은 button/input/badge variant를 적용했는가?
- [ ] icon-only button에 accessible name이 있는가?
- [ ] label/helper/error가 control과 연결되어 있는가?
- [ ] hover/focus/active/selected/disabled/loading 상태를 고려했는가?

### Table / Chart

- [ ] toolbar 순서가 search → filters/sort → primary action인가?
- [ ] table header 56px, micro uppercase, numeric right alignment인가?
- [ ] horizontal scroll, empty, pagination을 처리했는가?
- [ ] meatball이 popup 없이 기존 상세를 여는가?
- [ ] chart가 `ChartComponent`, chart tokens, accessible label을 사용하는가?
- [ ] 숫자/통화/백분율/날짜 formatting이 기존 helper와 일치하는가?

### 완료 전

- [ ] 기존 AMS 페이지와 시각적으로 대조했는가?
- [ ] build/lint 오류가 없는가?
- [ ] 실제 브라우저에서 주요 상호작용을 검증했는가?
- [ ] 디자인 시스템 밖 새 규칙이 생겼다면 승인받았는가?

---

## 12. 실제 구현과 규칙의 불일치 / 확인 필요

1. `/design-system`은 독립 catalog만이 아니라 과거 Dashboard 예시 전체를 함께 포함하며 페이지 설명도 Design System 전용 문구가 아니다.
2. shared barrel `src/app/shared/index.ts`는 아무 component도 export하지 않는다. 직접 경로 import가 현재 방식이다.
3. Button/Input/Table/Dialog/Tabs/Toast 등 대부분이 각 페이지 SCSS에 복제되어 있어 공용 Angular API가 아니다.
4. Showcase table header/row는 50/48px, 실제 목록은 header 56px + 11px vertical cell padding이다. 신규 관리 목록은 실제 목록 규격을 우선한다.
5. focus token은 있으나 native input/checkbox/radio의 outline/box-shadow를 제거한 코드가 있어 keyboard focus 가시성이 부족하다.
6. breakpoints와 z-index가 중앙 token으로 정의되지 않았다.
7. `#fcfcfd`, gauge 색, chart tooltip 색 등 일부 hardcoded 값이 남아 있다. 신규 코드에 확장하지 않는다.
8. card shadow token은 있지만 기본 카드에는 그림자를 쓰지 않는 것이 합의 규칙이다. shadow는 overlay에 한정한다.
9. 실제 list의 action popup template은 제거되었지만 일부 page SCSS/TS에 action-menu 관련 잔여 코드가 있다. 동작 기준은 “직접 상세”다.
10. Design System API Key 카드는 sample credential 표시일 뿐 실제 key storage/masking 정책이 아니다.
11. 독립/shared Drawer와 Design System specimen은 없지만 모바일 Sidebar는 실제 navigation drawer다. Authentication, 공용 page error, 공용 toast service, 공용 multi-select/date-range component는 미구현이다.
12. Design System input은 주로 36px지만 실제 CRUD form은 40px도 반복 사용한다. toolbar 36px은 확정적이나 form control density는 완전히 통일되지 않았다.
13. `navigation.config.ts`의 “Dashboard만 완성, 나머지는 placeholder” 주석은 현재 라우팅과 맞지 않는다. 모든 12개 navigation item에 실제 route가 있고 placeholder route 배열은 사실상 비어 있다.
14. Dashboard/Chart/Gauge에는 loading, empty, error, retry API와 chart data 대체 설명이 없다. Gauge는 시각값을 clamp하지만 `aria-label`에는 원 입력값을 사용한다.
15. Plans/Policies에는 별도 읽기 전용 상세가 없어 현재 meatball이 record dialog를 연다. true detail UX는 미확정이다.

이 불일치는 본 문서 작성 과정에서 수정하지 않았다. 디자인 시스템 자체를 정비할 때 별도 영향 분석과 승인이 필요하다.
