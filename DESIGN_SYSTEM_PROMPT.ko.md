# AMS 디자인 시스템 적용 프롬프트

이 문서는 2026-11-20 코드 점검 결과다. 이후 개발자가 화면을 다시 만들거나 공유 컴포넌트로 옮길 때, 지금 화면에 보이는 디자인이 그대로 재현되도록 기준을 고정한다.

`DESIGN.ko.md`는 토큰과 방향의 기준이다. 다만 19장의 “Dashboard만 구현되고 나머지는 플레이스홀더”는 현재 코드와 다르다. 11개 메뉴가 이미 구현되어 있다. 시각 값의 기준은 토큰 파일이고, 실제 화면 패턴의 기준은 아래 계약이다.

## 프롬프트

아래 블록을 개발 지시로 그대로 사용한다.

```text
AMS / AI Ops Center Angular 19 프론트엔드에 디자인 시스템을 적용한다.

목표: 페이지마다 복사된 버튼, 테이블, 카드, 다이얼로그, 페이지네이션을 공유 컴포넌트 또는 전역 클래스로 교체한다. 교체 후 화면은 지금과 같은 정보 구조, 같은 간격, 같은 색, 같은 타이포를 유지한다. 새 화면을 그리지 않는다. 목 데이터, 라우트, IA, 비즈니스 규칙을 바꾸지 않는다.

기준 파일:
- 토큰: src/styles/tokens/_colors.scss, _spacing.scss, _typography.scss, _effects.scss
- 방향: DESIGN.ko.md 3~6장, 9장, 16~18장
- 버튼 변형의 시각 원본: src/app/pages/overview/components/component-showcase/component-showcase.component.scss 의 .ds-button
- 생성 버튼의 승인된 모습: Dashboard의 “Product 추가 +” (overview.page.html)
- 목록 화면 패턴의 원본: organization-list, plans-points
- 상태 배지: app-status-badge
- 아이콘: app-icon. 새 아이콘 세트를 추가하지 않는다.

금지:
- 페이지 SCSS에 .button, .data-table, .dialog, .summary-card, .pagination, .icon-action 을 새로 복사하지 않는다.
- #fff, #fcfcfd, 36px, 16px 같은 값을 컴포넌트에 직접 쓰지 않는다. 토큰이 없으면 토큰을 먼저 추가한다.
- Primary 파란색을 링크, 배지, 차트, 버튼에 서로 다른 hex로 쓰지 않는다. --color-primary (#2F9AFF) 하나만 쓴다.
- 카드에 테두리와 그림자를 동시에 넣지 않는다. 그림자는 다이얼로그, 드롭다운, 토스트만.
- 생성 버튼의 아이콘을 라벨 앞으로 옮기지 않는다.
```

## 점검 결론

토큰은 중앙에 있다. 컴포넌트는 중앙에 있지 않다.

| 계층 | 상태 | 위치 |
| --- | --- | --- |
| 색, 간격, 타이포, 라디우스, 그림자 | 공유 토큰 | `src/styles/tokens` |
| 체크박스, 라디오 | 전역 스타일 | `src/styles/base/_controls.scss` |
| 아이콘, 상태 배지, 차트, 게이지 | Angular 공유 컴포넌트 | `src/app/shared/components` |
| 버튼, 입력, 테이블, KPI 카드, 다이얼로그, 토스트, 페이지네이션, 탭, 미트볼 메뉴 | 페이지마다 SCSS 복사 | 각 `*.page.scss` |
| Showcase 버튼 | 실제 화면과 다른 클래스 | `.ds-button` |

`src/app/shared/index.ts`는 빈 export다. 공유 컴포넌트를 추가해도 여기서 다시 export하지 않으면 페이지가 계속 로컬 마크업을 쓴다.

생성 버튼 마크업은 2026-11-20에 라벨 + `plus` 15px로 맞춰 두었다. 스타일은 여전히 페이지 로컬 `.button`이다. 그래서 대시보드 버튼과 메뉴 버튼은 같은 클래스 이름인데 수치가 다르다.

## 버튼 불일치

승인된 생성 버튼은 대시보드다.

```html
<button class="button button--primary" type="button">
  Product 추가
  <app-icon name="plus" [size]="15" />
</button>
```

| 속성 | Dashboard / Showcase | 나머지 메뉴 페이지 |
| --- | --- | --- |
| 높이 | `var(--control-height-md)` 36px | `min-height: 36px` |
| 간격 | Dashboard 6px, Showcase `var(--space-2)` 8px | `var(--space-2)` 8px |
| 패딩 | `0 var(--space-3)` 12px | `0 var(--space-4)` 16px |
| 테두리 | `1px solid var(--color-primary)` | `border: 0` |
| 글자색 | `var(--color-on-primary)` | `#fff` |
| Hover | `--color-primary-hover` | 없음 |
| Active | Showcase만 `--color-primary-active` | 없음 |
| Disabled | 없음 | 없음 |

공유 버튼으로 옮길 때의 단일 규격:

- 레이아웃: `inline-flex`, 높이 `--control-height-md`, 세로 중앙 정렬, `gap: 6px`, 패딩 `0 var(--space-3)`, 라디우스 `--radius-small`, 줄바꿈 없음.
- 글자: `--font-size-body-sm`, `--font-weight-semibold`.
- Primary: 배경과 테두리 `--color-primary`, 글자 `--color-on-primary`. Hover는 `--color-primary-hover`. Active는 `--color-primary-active`.
- Secondary: 배경 `--color-secondary`, 글자 `--color-on-secondary`.
- Outline: 배경 `--color-surface`, 글자 `--color-text-secondary`, 테두리 `var(--border-default)`. Hover 배경은 아래 hover 토큰.
- Ghost: 배경 투명, 테두리 투명, 글자 `--color-text-secondary`.
- Danger: 배경과 테두리 `--color-danger`. Hover는 `--color-danger-text`.
- 크기: Small 32px, Medium 36px, Large 40px. 화면의 기본은 Medium.
- Focus-visible: 2px solid `--color-primary`, offset 2px. 제거하지 않는다.
- Disabled: 배경 `--color-disabled-bg`, 글자 `--color-disabled-text`, 커서 `not-allowed`.

생성 버튼만의 추가 규칙:

- 테이블 툴바의 맨 오른쪽, 검색과 필터 뒤에 둔다. 페이지 헤더에는 두지 않는다.
- 라벨 뒤에 `app-icon name="plus" size="15"`.
- 한 도구 모음에 Primary 생성 버튼은 하나. 탭이 바뀌면 그 탭의 생성 버튼 하나만 Primary.
- 저장, 취소, 닫기, 비활성화, 삭제, 새로고침, 메모 추가, 추가 작업, 가져오기에는 plus 아이콘을 붙이지 않는다.

현재 생성 버튼 목록:

| 화면 | 라벨 |
| --- | --- |
| Organizations | Organization 추가 |
| Organization 상세 Teams | Team 추가 |
| Organization 상세 Products | Product 추가 |
| Users | 사용자 추가 |
| Products | 제품 추가 |
| Product 상세 | Mapping 추가 |
| Plans | 플랜 추가 |
| Point Policies | 정책 추가 |
| Providers | Provider 추가 |
| Models | Model 추가 |
| Provider 상세 | Model 추가 |
| Usage & Costs | Rate Card 추가 |
| Admin | 관리자 추가 |
| Presets | Preset 추가 |
| Incidents | 장애 추가 |
| Dashboard | Product 추가 |

## 복사된 컴포넌트

아래 클래스는 페이지 SCSS에 같은 선언이 반복된다. 공유 구현 하나로 바꾸고, 페이지에는 폭이나 열 구성만 남긴다.

### KPI 카드

- 흰 표면 `--color-surface`, 라디우스 `--radius-large`, 패딩 `--space-5`, 테두리 없음, 그림자 없음.
- 라벨 `--color-text-secondary`, `--font-size-body-sm`.
- 값 28px, `--color-text-primary`, 줄 높이 1.1. 비교 숫자는 tabular-nums.
- 보조 문구 `--color-text-muted`, `--font-size-caption`.
- 목록 상단은 3열 또는 4열, gap `--space-4`.

### 테이블 카드

- 표면은 KPI 카드와 같다.
- 툴바 최소 높이 64px, 패딩 `--space-3 --space-4`.
- 제목은 semibold, 건수는 `--color-text-muted`.
- 검색: 높이 `--control-height-md`, 왼쪽 패딩 42px, 배경 `--color-surface-subtle`, 라디우스 `--radius-full`, 아이콘 `search` 15px.
- 필터 셀렉트: 같은 높이, 라디우스 full, 배경 subtle, 테두리 없음.

### 테이블

- `border-collapse: separate`, 글자 `--font-size-body-sm`.
- 헤더 높이 56px, 배경 `--color-surface-sunken`, 글자 `--font-size-micro`, uppercase, letter-spacing `.035em`, 색 `--color-text-muted`.
- 헤더 하단은 8px 투명 보더로 본문과 띄운다.
- 셀 패딩 `11px var(--space-4)`. 한 줄, ellipsis.
- 행 호버는 지금 `#fcfcfd`다. `--color-hover`(`#f1f2f4`)로 바꾸면 화면이 달라진다. 공유 전에 `--color-row-hover: #fcfcfd` 토큰을 추가하고 그 토큰만 쓴다.
- Actions 헤더는 112px, overflow visible, uppercase가 잘리지 않아야 한다. 짧은 열은 72px로 되돌리지 않는다.
- 숫자 비교 열은 오른쪽 정렬, tabular-nums.
- 빈 상태는 높이 120px, 중앙, `--color-text-muted`.
- 행 클릭으로 상세에 들어가는 테이블과, 버튼으로만 들어가는 테이블을 구분한다. 클릭 행은 `cursor: pointer`.

### 미트볼 메뉴

- 아이콘 `more`, 16px. 가로 점 세 개다.
- 버튼 32px, 배경 투명, 색 `--color-text-muted`, 라디우스 `--radius-small`.
- `aria-label`에 대상 이름과 작업을 넣는다. 예: `Organization 작업`, `Sample AMS App 상세`.
- 테이블 행 메뉴는 기존처럼 상세, 수정, 삭제 항목을 연다.
- Health 카드는 카드 전체를 버튼으로 만들지 않는다. 상태 배지 오른쪽 미트볼만 서비스 상세를 연다. 카드 hover로 지표 배경을 바꾸지 않는다.
- 메뉴 레이어: 고정 위치, 너비 148px, 패딩 6px, 테두리 `--border-default`, 라디우스 `--radius-medium`, 그림자 `--shadow-dropdown`.

### 다이얼로그

- 배경 `rgb(21 24 30 / 38%)`. 토큰 `--color-overlay`와 같다.
- 패널 패딩 `--space-6`, 라디우스 `--radius-large`, 그림자 `--shadow-modal`.
- `max-height: calc(100vh - 40px)`. 기본 스크롤바는 숨긴다. 스크롤하는 동안만 오른쪽 6px 오버레이 막대가 나타나고, 멈추면 700ms 뒤 사라진다. 대시보드 상세 모달과 같다. 짧은 화면에서 내용이 잘리면 안 된다.
- 폭은 용도만 다르다. 확인 480px, 폼 620px, 중간 폼 760px, 넓은 상세 960px. 폭만 입력으로 받는다.
- 제목 `--font-size-h2`. 닫기 버튼 32px.
- 푸터는 오른쪽 정렬, 위 여백 `--space-6`.

### 페이지네이션

- 버튼 30px, 라디우스 `--radius-small`, 테두리 `--border-default`.
- 활성: 글자 `--color-primary-active`, 배경 `--color-primary-subtle`, 테두리 `--color-primary-200`.
- 비활성 opacity .4.

### 페이지 헤더와 탭

- H1 `--font-size-h1`, bold. 설명 `--font-size-body-lg`, `--color-text-secondary`.
- 헤더와 설명 사이 `--space-1`. 헤더 블록 아래 `--space-5`.
- 탭 높이 44px. 활성 글자 `--color-primary-active`, 아래 2px `--color-primary`.
- 샘플 데이터 문구는 `--color-text-muted`, `--font-size-caption`. 실제 연동처럼 쓰지 않는다.

### Health 카드

Provider & Model 쇼케이스 카드와 같은 밀도로 맞춘 상태다. 다시 띄우거나 붙이지 않는다.

- 패널: 패딩 `--space-6`, 흰 표면, 라디우스 `--radius-large`.
- 그리드 3열, gap `--space-4`. 1279px 이하 2열, 1024px 이하 1열.
- 카드 패딩 `--space-4`. 카드 테두리와 배경 없음. 카드 사이 콘텐츠 간격은 패딩과 gap이 합쳐져 48px다.
- 지표 영역: 배경 `--color-surface-subtle`, 패딩 `--space-3`, 라디우스 `--radius-small`, 열 비율 1.35 / 0.85.
- 푸터는 상태 점 6px와 “샘플 상태”만 둔다. 서비스 카드에 미해결 장애 수를 붙이지 않는다. 그 수는 Incidents 탭의 Open Incidents에만 둔다.

## 하드코딩으로 남긴 값

공유 컴포넌트로 옮기기 전에 토큰으로 바꾼다.

| 값 | 쓰임 | 처리 |
| --- | --- | --- |
| `#fff` | Primary, Danger 글자 | `--color-on-primary` |
| `#fcfcfd` | 행, 고스트, 아웃라인 hover | 새 토큰 `--color-row-hover`. `--color-hover`로 대체하지 않는다 |
| `6px` | Dashboard 버튼 아이콘 간격 | `--space-1-5`를 만들지 말고 버튼 계약의 6px로 고정 |
| `11px` | 테이블 셀 세로 패딩 | 테이블 계약에만 둔다 |
| `42px` | 검색 아이콘 자리 | 검색 계약에만 둔다 |
| `112px` | Actions 열 | 테이블 계약에만 둔다 |
| `rgb(21 24 30 / 38%)` | 다이얼로그 배경 | `--color-overlay` |

## 적용 순서

1. 토큰에 `--color-row-hover: #fcfcfd`를 추가한다.
2. `app-button`을 만든다. variant는 primary, secondary, outline, ghost, danger. size는 sm, md, lg. 기본은 primary + md.
3. 생성 버튼은 `app-button`에 라벨과 plus 아이콘을 넣는 사용 예로 고정한다. 별도 색을 만들지 않는다.
4. 페이지 로컬 `.button` 선언을 삭제하고 마크업을 `app-button`으로 바꾼다. Dashboard `.button`도 같은 컴포넌트로 바꾼다.
5. `.ds-button` 쇼케이스는 `app-button` 데모로 바꾼다. 클래스 두 벌을 유지하지 않는다.
6. 테이블, 테이블 카드, 페이지네이션, 다이얼로그, 미트볼을 같은 방식으로 옮긴다. 열 너비, 최소 폭, 다이얼로그 폭만 페이지 입력으로 남긴다.
7. 한 페이지를 바꿀 때마다 그 페이지의 생성, 행 메뉴, 다이얼로그, 빈 상태를 브라우저에서 확인한다.

## 수용 기준

- Organizations, Plans, System Monitoring Health에서 생성 버튼의 높이, 패딩, 파란색, 라벨, 오른쪽 plus가 Dashboard와 같다.
- Actions 헤더가 `ACTIONS`로 온전히 보인다.
- Health 카드 간격은 지금처럼 Provider 카드와 같은 48px 콘텐츠 간격이다.
- Health 카드 본문을 눌러도 상세가 열리지 않고, 미트볼만 상세를 연다.
- 행 hover는 `#fcfcfd`다.
- 다이얼로그는 높이 180px 뷰포트에서도 스크롤되며 닫기 버튼이 패널 안에 있다.
- 페이지 SCSS에서 `.button {`, `.data-table {`, `.dialog {` 검색 결과가 페이지 전용 폭 수정 외에 남지 않는다.
- 샘플, 가상, 연결되지 않음이라는 문구를 실제 운영 상태처럼 바꾸지 않는다.
