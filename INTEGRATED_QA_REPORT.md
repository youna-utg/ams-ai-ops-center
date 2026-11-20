# AMS Redesign — STEP L Integrated QA Report

검토일: 2026-11-20  
대상: Angular 19 기반 AMS(AI Ops Center) Frontend Mock Prototype  
기준 IA: v1.1, 6개 그룹 / 11개 메뉴

## A. Executive Summary

### 전체 구현 상태

- IA v1.1의 11개 메뉴와 전용 상세 페이지/상세 Dialog 구조가 모두 코드에 존재하며 주요 Route 진입을 확인했다.
- Organizations/Users, Products/Providers/Models, Usage/Costs, Admin/Permissions, Monitoring/Incidents, Settings는 각 기능 Store의 메모리 상태를 공유한다.
- 실제 Backend, 인증, 권한 강제, Provider API, 알림 전송, Monitoring 연결은 구현되지 않은 Mock Prototype이다.
- P0는 발견되지 않았다.
- 재현되거나 코드로 확정된 P1 3건과 안전한 P2 2건을 최소 수정했다.
- 프로덕션 빌드는 성공했다. 자동 테스트는 Spec 파일이 없어 실행에 실패했다.

### 점검 범위

- App Shell, Sidebar, Route, 11개 메뉴, 상세 Page/Dialog, Shared Store, Mock 관계, KPI/비용 집계
- 1440px, 1280px, 1024px 대표 Desktop 화면 및 매우 짧은 Viewport의 Dialog
- 기본 키보드/ARIA/Focus 패턴 정적 검토
- 대표 교차 메뉴 흐름: Provider 이름 반영, Usage/Cost 집계, Incident/Health 분리, Settings Draft

### 주요 발견 사항

- User Detail의 Available Products가 실효 접근이 아닌 고객사 계약 수를 표시했다.
- Dashboard 기간 변경이 Chart에만 적용되고 요청/Token/비용 KPI에는 반영되지 않았다.
- 삭제된 Organization 소속 User Activity가 이동 가능한 것으로 남을 수 있었다.
- Settings 확인 Dialog가 매우 짧은 Viewport에서 잘렸다.
- Component Showcase의 일반 `href` 이동은 메모리 Mock 상태를 초기화할 수 있었다.
- 다수 Dialog의 Focus 이동/Trap/복원, Escape 닫기, 접근 가능한 제목 연결이 일관되지 않다.
- Dashboard의 Product 추가는 ProductsStore와 독립된 Dashboard 샘플 배열만 변경한다.

### 수정 완료 현황

- 완료: L-001, L-002, L-003, L-004, L-005
- 미해결: L-006 ~ L-012
- 수정은 기존 IA, Route, Store 인터페이스, Detail UX, Design Token을 변경하지 않는 범위로 제한했다.

### 잔여 위험

- 자동 회귀 테스트가 없어서 Store 관계와 복합 Form 회귀를 수동/정적 검토에 의존한다.
- 메모리 상태이므로 새로고침 시 변경이 사라진다.
- Dashboard의 일부 숫자와 Product 추가는 다른 메뉴의 Shared Store와 별도 도메인이다.
- 접근성 문제는 공통 Dialog/Tab 패턴 차원의 정리가 필요해 STEP L에서 부분 수정하지 않았다.

## B. Menu Coverage

### 1. Dashboard — Implemented / Partial Verification

- KPI, Chart, Product/Provider/Activity/Health 카드와 Component Showcase가 구현되어 있다.
- 기간별 요청/Token/Provider Cost KPI를 수정하고 14일/30일 값 변경을 브라우저에서 확인했다.
- Product 추가는 Dashboard 로컬 배열만 변경하므로 Shared Products와 통합되지 않았다.
- Component Showcase는 별도 Route가 아니라 Dashboard 하단에 포함된다.

### 2. Organizations — Implemented

- List, 검색/필터, Add/Edit, 상태, Detail, Team/User/Product/Usage/Activity가 구현되어 있다.
- 사용자·팀·Product Access는 OrganizationsStore를 공유한다.
- 1024px에서 가로 Page Overflow는 재현되지 않았다.

### 3. Users — Implemented / Partial Verification

- List, Add/Edit, Detail, 상태, Product Access, Usage, History, CSV Bulk Import가 구현되어 있다.
- CSV Parser의 BOM, 따옴표, 쉼표, 필수 Header, 중복 이메일, Organization Code, Team 관계, 전체 검증 후 Import를 코드로 확인했다.
- 실제 파일 선택을 통한 CSV 업로드는 이번 실행에서 Not Tested다. XLSX 지원 표시는 없다.
- Available Products 실효 접근 집계를 수정하고 브라우저에서 0건으로 재검증했다.

### 4. Products — Implemented

- List, Add/Edit, 전용 Detail, AI Configuration, LLM/Non-LLM, 다중 Mapping, Organizations, Activity, 상태가 구현되어 있다.
- 완전히 같은 Mapping의 중복 방지와 Mapping 기록 보존 로직을 코드로 확인했다.
- Provider 이름 변경이 Product Mapping Filter에 즉시 반영되는 것을 브라우저에서 확인했다.

### 5. Plans & Points — Implemented

- Plans/Point Policies Tab, Add/Edit, 상태, Dynamic Form, Rule Summary, Validation이 구현되어 있다.
- Organization/User/Product Plan Assignment는 구현하지 않았으며 범위 제외 결정과 일치한다.
- 실제 Policy 적용 방식은 Requires Team Review다.

### 6. Providers & Models — Implemented

- Provider List/Detail, Model List/Detail Dialog, Add/Edit, 상태, Products 연결이 구현되어 있다.
- 비활성화 시 기존 Mapping을 삭제하지 않는 구조를 확인했다.
- 실제 API 연결이 아닌 Sample/Mock임을 화면에서 안내한다.

### 7. Usage & Costs — Implemented

- API Usage, Cost Analytics, Rate Cards 3개 Tab과 필터, Detail, KPI, Chart, Pricing History가 구현되어 있다.
- 동일 기본 필터에서 API Usage 60건과 Cost Breakdown 요청 합계 60건이 일치했다.
- Total Provider Cost와 Breakdown 합계가 모두 `$2.0674`로 일치했다.
- Rate Card 상태 변경 Activity는 구현되지 않았다.

### 8. Admin & Permissions — Implemented

- Admin Accounts, Permissions, Presets, Add/Edit, 상태, Preset/Custom, 복제/수정이 구현되어 있다.
- `Manage=true`이면 `View=true`, `View=false`이면 `Manage=false`가 되는 공통 Toggle 로직을 확인했다.
- Preset 권한은 참조 시 계산되고 Custom 권한은 복제 저장되어 상호 분리된다.
- 실제 Route Guard와 Backend Enforcement는 범위 제외다.

### 9. Activity History — Implemented

- 전역 List, 기간/Module/Action/Actor/Search, Detail, Before/After, Related Navigation이 구현되어 있다.
- 독립 Activity 배열을 중복 유지하지 않고 각 Store Activity를 통합 계산한다.
- 삭제된 Organization 소속 User Event의 이동 가능 상태를 수정했다.

### 10. System Monitoring — Implemented

- Health, System Logs, Incidents, Detail Dialog, 상태, Timeline, Related Logs가 구현되어 있다.
- Sample AMS API Incident를 Resolved로 변경한 뒤 Open Incidents는 0이 되었지만 Health는 계속 `저하`로 유지됨을 확인했다.
- 실제 Monitoring 연결이 아닌 Sample Data임을 화면에서 안내한다.

### 11. Settings — Implemented

- General, Notifications, Preferences 모두 Draft와 명시적 Save Changes 방식을 사용한다.
- Toggle/Reset은 저장 전 Draft에만 적용되고 Save 시 Store와 Activity가 변경되는 구조를 확인했다.
- 매우 짧은 Viewport에서 Dialog 내부 Scroll을 수정하고 재검증했다.
- 실제 서버 영속화와 알림 전송은 구현되지 않았다.

## C. Issue List

### L-001

- Priority: P1
- Category: Data Consistency Issue
- Affected Menu: Users
- Description: User Detail의 Available Products가 실효 접근 가능 수가 아니라 Organization Access가 `이용 중`인 수를 표시했다.
- Reproduction Steps: `/users/user-0003-01` 진입 → Overview KPI 확인 → Product Access Tab의 Organization/User/Product 상태 비교
- Expected Result: User, Organization, OrganizationProductAccess, Product 상태를 반영한 `이용 가능` 행만 집계
- Actual Result: Product가 점검/비활성이어도 2건으로 표시
- Root Cause: `organizationAccess === '이용 중'`만 필터링
- Fix Status: Fixed
- Modified Files: `src/app/pages/users/user-detail/user-detail.page.ts`, `user-detail.page.html`
- Verification Result: Passed — 같은 User에서 KPI가 0, 설명이 `실효 이용 가능 제품`으로 표시됨

### L-002

- Priority: P1
- Category: Data Consistency Issue
- Affected Menu: Dashboard
- Description: 기간을 바꿔도 Total API Requests, Total Tokens, Total Provider Cost가 변경되지 않았다.
- Reproduction Steps: Dashboard에서 30일 KPI 확인 → 14일 선택 → KPI 비교
- Expected Result: 선택 기간 Trend Series에서 동일 KPI 집계
- Actual Result: Chart만 바뀌고 KPI는 Product Mock의 고정 합계 유지
- Root Cause: KPI는 `PRODUCTS`, Chart는 `TREND_DATA[selectedRange]`를 참조
- Fix Status: Fixed
- Modified Files: `src/app/pages/overview/overview.page.ts`
- Verification Result: Passed — 30일 API Requests 25.4K에서 14일 11.6K로 변경됨

### L-003

- Priority: P1
- Category: Functional Bug
- Affected Menu: Activity History
- Description: 삭제된 Organization 소속 User Event가 이동 가능한 것으로 남을 수 있었다.
- Reproduction Steps: Organization 삭제 후 기존 User Event의 Related Entity 이동 가능 상태 계산
- Expected Result: User와 상위 Organization이 모두 유효할 때만 이동 가능
- Actual Result: User Event는 User 삭제 여부만 검사
- Root Cause: Parent Organization 유효성 조건 누락
- Fix Status: Fixed
- Modified Files: `src/app/pages/activity/data/activity-feed.ts`
- Verification Result: Passed by code review and production build; destructive browser scenario는 Not Tested

### L-004

- Priority: P2
- Category: UX/UI Issue
- Affected Menu: Settings
- Description: 높이 180px Viewport에서 Reset Dialog가 화면 밖으로 잘렸다.
- Reproduction Steps: 1024×180 → Settings → 기본값으로 되돌리기
- Expected Result: Dialog가 Viewport 안에 있고 내부 Scroll 가능
- Actual Result: Dialog bottom이 Viewport 밖이며 `overflow-y: visible`
- Root Cause: Dialog에 Viewport 기준 최대 높이와 Overflow 없음
- Fix Status: Fixed
- Modified Files: `src/app/pages/settings/settings.page.scss`
- Verification Result: Passed — top 20, bottom 160, height 140, `overflow-y: auto`, scrollHeight 176

### L-005

- Priority: P2
- Category: UX/UI Issue
- Affected Menu: Dashboard / Component Showcase
- Description: Showcase 예시 링크가 전체 문서 이동을 수행해 메모리 Mock 변경을 초기화할 수 있었다.
- Reproduction Steps: Mock 상태 변경 → Dashboard Showcase의 예시 Navigation 링크 선택
- Expected Result: Angular SPA Navigation
- Actual Result: 일반 `href`에 의한 문서 Reload 가능
- Root Cause: RouterLink 미사용
- Fix Status: Fixed
- Modified Files: `component-showcase.component.ts`, `component-showcase.component.html`
- Verification Result: Passed by template/lint/build 검증

### L-006

- Priority: P1
- Category: Data Consistency Issue
- Affected Menu: Dashboard / Products
- Description: Dashboard Product 추가가 ProductsStore가 아닌 Dashboard 로컬 배열만 변경한다.
- Reproduction Steps: Dashboard Product 추가 → Products List 이동
- Expected Result: Shared Product 변경이 관련 메뉴에 반영
- Actual Result: Dashboard 안에서만 추가 항목 표시
- Root Cause: Dashboard용 Product 모델과 ProductsStore의 독립 상태
- Fix Status: Open
- Modified Files: 없음
- Verification Result: Confirmed from code
- Reason Not Fixed: Dashboard의 RPM/RPH/Quota 필드와 Catalog Product 모델의 정책이 달라 단순 연결은 데이터 의미를 임의 확정함

### L-007

- Priority: P2
- Category: Missing Implementation
- Affected Menu: Usage & Costs / Activity History
- Description: Rate Card 활성/비활성 변경이 Pricing History 또는 전역 Activity에 기록되지 않는다.
- Reproduction Steps: Rate Card 상태 변경 → Activity History 확인
- Expected Result: 확정된 경우 상태 변경 Event 1건 기록
- Actual Result: 상태와 updatedAt만 변경
- Root Cause: RateCardHistory는 가격 Before/After 구조이고 별도 Usage Activity 모델이 없음
- Fix Status: Open
- Modified Files: 없음
- Verification Result: Confirmed from code
- Reason Not Fixed: 가격 이력과 운영 Activity를 합칠 정책이 미정

### L-008

- Priority: P2
- Category: UX/UI Issue
- Affected Menu: 공통 Dialog / Tabs
- Description: 다수 Dialog에서 Open 시 Focus 이동, Focus Trap/복원, Escape 닫기, `aria-labelledby`가 일관되지 않다. Tab도 Arrow/Home/End 동작이 없다.
- Reproduction Steps: Organization 또는 Settings Dialog Open → 현재 Focus 확인 → Escape 입력
- Expected Result: Focus가 Dialog로 이동하고 Keyboard로 닫기/순환 가능
- Actual Result: Focus가 배경 Open 버튼에 남고 Escape로 닫히지 않는 Dialog가 존재
- Root Cause: 화면별 Overlay 구현에 공통 Focus 관리가 없음
- Fix Status: Open
- Modified Files: 없음
- Verification Result: Failed — 브라우저와 정적 검색으로 재현
- Reason Not Fixed: 일부 화면만 수정하면 패턴이 더 불일치하므로 공통 Dialog 작업으로 별도 수행 필요

### L-009

- Priority: P2
- Category: Data Consistency Issue
- Affected Menu: Organizations
- Description: Organization Product Usage의 `activeUsers` Sample 값이 현재 Sample User Population보다 클 수 있다.
- Reproduction Steps: Organization Usage 값과 같은 Organization의 User 수 비교
- Expected Result: 같은 의미의 현재 Active User라면 모집단 이내
- Actual Result: 일부 Usage Sample이 현재 User Mock 수를 초과
- Root Cause: Usage Mock이 별도 샘플 규모로 작성됨
- Fix Status: Open
- Modified Files: 없음
- Verification Result: Confirmed from code/data
- Reason Not Fixed: 기간 누적/외부 집계인지 현재 사용자 수인지 의미가 미정

### L-010

- Priority: P2
- Category: Data Consistency Issue
- Affected Menu: Usage & Costs / Products / Organizations
- Description: 일부 Usage Record 조합은 현재 Product Mapping 또는 Organization Access와 일치하도록 강제되지 않는다.
- Reproduction Steps: Usage의 Product/Provider/Model 조합과 ProductModelMapping 비교
- Expected Result: 운영 정책상 필요한 경우 명시된 Snapshot 또는 Mapping 관계와 일치
- Actual Result: Usage Mock은 독립 Record로 조회 가능
- Root Cause: Historical Usage Snapshot과 현재 Configuration의 관계가 정의되지 않음
- Fix Status: Open
- Modified Files: 없음
- Verification Result: Requires Team Review

### L-011

- Priority: P3
- Category: UX/UI Issue
- Affected Menu: Organizations
- Description: 정확히 1024px에서 Organization Detail Overview Grid가 2열로 남아 다른 상세 화면과 반응형 전환 시점이 다르다.
- Reproduction Steps: 1024px에서 Organization Detail Overview 확인
- Expected Result: 팀이 정한 Desktop 기준과 일치
- Actual Result: 523.8px / 349.2px 2열, 가로 Overflow는 없음
- Root Cause: Breakpoint가 `max-width: 1023px`
- Fix Status: Review
- Modified Files: 없음
- Verification Result: No functional failure

### L-012

- Priority: P2
- Category: UX/UI Issue
- Affected Menu: Dashboard / Component Showcase
- Description: 운영 Dashboard 하단에 전체 Component Showcase와 동작 가능한 Demo Form/Button이 직접 노출된다.
- Reproduction Steps: Dashboard에서 약 3,411px 아래로 Scroll
- Expected Result: 팀이 의도한 범위에서 Component Showcase에 접근하되 운영 Dashboard와 Design Reference의 경계가 명확함
- Actual Result: 약 13,546px 길이의 같은 문서 안에 Showcase와 Demo Control이 이어짐
- Root Cause: `app-component-showcase`가 Dashboard Template 하단에 직접 포함됨
- Fix Status: Review
- Modified Files: 없음
- Verification Result: Confirmed in browser
- Reason Not Fixed: STEP L은 Component Showcase 접근을 유지하도록 요구하며 별도 Route 전환 여부는 UX 결정이 필요함

## D. Shared Data Validation

### Organizations ↔ Users ↔ Teams

- Passed by code review: User 생성/수정/삭제 시 Team Membership을 `syncTeamMembership`으로 갱신한다.
- Passed by code review: Organization 변경 시 이전/새 Organization 조회 결과가 동일 User Record를 기준으로 계산된다.
- Passed by code review: Active User Count는 활성 Organization/User Record에서 계산한다.

### Organizations ↔ Products

- Passed by code review: OrganizationProductAccess는 OrganizationsStore의 단일 관계 목록을 양쪽 화면이 참조한다.
- Passed by code review: 종료/제거 시 History Record를 별도로 유지한다.
- Open: Dashboard Product 추가는 이 관계와 연결되지 않는다(L-006).

### Users ↔ Products

- Passed after fix: User/Organization/Access/Product 상태를 분리하고 Effective 상태로 Available Products를 집계한다.
- Confirmed: 종료일 경과만으로 자동 접근 차단하지 않는다.

### Products ↔ Providers & Models

- Passed in browser: OpenAI를 `OpenAI QA`로 수정하자 ChangeUp Mapping Filter Option에 즉시 반영됐다.
- Passed by code review: Provider/Model 비활성화 시 Mapping Record는 보존된다.
- Passed by code review: 동일 Action Code에 여러 Provider/Model Mapping을 허용하고 완전 중복은 방지한다.

### Usage ↔ Costs

- Passed in browser: 기본 30일 필터 API Usage 60건 = Cost Breakdown 60건.
- Passed in browser: Total Provider Cost `$2.0674` = Breakdown 합계 `$2.0674`.
- Passed by code review: Usage와 Cost Analytics가 같은 UsageStore Record를 필터링한다.
- Passed by code review: 과거 Usage Record는 계산된 Cost Snapshot을 보유해 Rate Card 수정으로 변경되지 않는다.

### Admin ↔ Permissions ↔ Presets

- Passed by code review: Manage/View 종속 규칙을 `applyToggle`이 보장한다.
- Passed by code review: Preset Admin은 현재 Preset을 참조하고 Custom Admin은 복제 권한을 저장한다.
- Passed by code review: Preset 수정 Activity는 해당 Preset Admin History에만 결합된다.

### Activity History

- Passed by code review: Store별 Activity를 ActivityFeed에서 통합하며 별도 중복 저장소를 두지 않는다.
- Fixed: 삭제된 Parent Organization의 User Event Navigation 차단.
- Open: Rate Card 상태 Activity(L-007).

### Monitoring ↔ Incidents

- Passed in browser: Incident Resolved 후 Open Incident Count는 1→0으로 변경.
- Passed in browser: 같은 Service Health는 `저하`로 유지되어 Incident 상태와 자동 동일시하지 않음.
- Passed by code review: Related Log/Incident는 Service/Incident ID로 연결.

### Settings

- Passed by code review: General/Notifications/Preferences 모두 Draft → Save 구조.
- Passed in browser: Reset Dialog 문구가 저장 전 Draft 적용임을 명시.
- Passed by code review: 저장된 변경만 Settings Activity를 생성한다.

## E. UX/UI Review

### Passed

- Sidebar IA는 6개 그룹/11개 메뉴로 일치한다.
- Detail Page에서도 상위 메뉴 Active 상태를 유지하는 Route 구조다.
- Dense Page 대표 표본에서 1440/1280/1024 가로 Page Overflow가 재현되지 않았다.
- 1280px Usage Rate Card Toolbar는 2줄로 안전하게 Wrap된다.
- Settings Tabs는 가로 Overflow를 허용하고 Layout은 1100px 이하 1열로 전환된다.
- Monitoring/Provider/Settings에 Mock 또는 Not Connected 안내가 존재한다.
- 11개 Sidebar Route에서 메뉴 Active 상태와 H1이 일치했다.
- Organization/User/Product/Provider의 잘못된 ID는 명시적 Not Found 화면을 표시했다.
- 9개 Legacy Route가 정규 URL과 올바른 Tab으로 전환됐다.
- Plans & Points와 Providers & Models의 Tab History가 Browser Back으로 복원됨을 확인했다.

### Open UX/Accessibility

- 공통 Dialog Focus/Escape/ARIA 문제(L-008).
- 정확히 1024px Organization Detail Grid 전환점 검토(L-011).
- Dashboard 하단에 Component Showcase가 직접 포함되어 운영 Dashboard와 Design Reference의 경계가 약하다.
- README는 현재 11개 메뉴가 아닌 Dashboard/Placeholder 단계로 설명되어 오래되었다.
- PlaceholderPage는 현재 Route에서 사용되지 않는다.

## F. Build & Test Results

### Passed

- `npx ng build`
  - Result: Passed
  - Initial bundle: 806.36 kB
  - Output: `dist/ams-ai-ops-center`
  - TypeScript compile error: 없음
- IDE diagnostics on modified source files
  - Result: Passed, linter error 없음
- Browser regression
  - User Available Products: Passed, 2→0
  - Dashboard 30일→14일 API Requests: Passed, 25.4K→11.6K
  - Settings 1024×180 Dialog: Passed, Viewport 안/내부 Scroll
  - Provider Rename→Product Mapping: Passed
  - Incident Resolved→Health 분리: Passed
  - Usage/Cost Request Count와 Cost 합계: Passed
  - 11개 Sidebar Route/H1/Active Menu: Passed
  - 4개 Detail Invalid ID Not Found: Passed
  - 9개 Legacy Redirect: Passed
  - Plans & Points Tab Back/Forward: Passed
  - Providers & Models Tab Browser Back: Passed

### Warnings

- Initial bundle budget 650.00 kB 대비 156.36 kB 초과.
- Component Showcase SCSS budget 30.00 kB 대비 8.69 kB 초과.
- npm의 `devdir` 환경 설정 경고.

### Failed

- `npm test -- --watch=false`
  - Result: Failed
  - 원인: `tsconfig.spec.json`의 `src/**/*.spec.ts` 입력 파일이 없어 TS18003 발생
  - 해석: 테스트 실패가 아니라 실행 가능한 Test Suite가 없는 상태다. Passed로 간주하지 않는다.

### Not Tested

- 실제 CSV 파일 선택/업로드
- 모든 Dialog의 모든 Keyboard 순환
- 모든 Filter/Page/Dialog 상태를 조합한 Browser Back/Forward 전체 경우
- 실제 API/Database/Auth/Notification/Monitoring
- 실제 Timezone 경계 및 DST

## G. Open Issues

### 미해결 Bug / Data Issue

- L-006 Dashboard Product 추가의 Shared Store 미연동
- L-007 Rate Card 상태 Activity 누락
- L-009 Organization Usage Active User Sample 의미 불일치

### UX 검토 사항

- L-008 공통 Dialog/Tab 접근성
- L-011 1024px Grid Breakpoint
- L-012 Component Showcase의 Dashboard 내 위치와 운영 화면 경계
- Stale README 및 Dead Placeholder 정리 시점

### Open Requirement

- Plan과 Point Policy 실제 적용 관계
- Historical Usage가 현재 Mapping/Access와 불일치할 때의 표시 정책
- Organization Usage의 Active Users가 현재 값인지 기간 누적인지
- Rate Card 상태 변경을 Pricing History에 넣을지 전역 Activity에만 넣을지
- Dashboard Product Create 필드와 Catalog Product 모델 통합 방식

### Technical Validation

- 실제 Customer Account 구조
- Organization / User / Team 관계와 Cardinality
- OrganizationProductAccess 적용 및 종료일 처리
- Product Status 변경과 실제 API 요청 차단
- Action Code별 복수 Provider/Model Routing
- Provider Cost와 Rate Card History 저장 방식
- Backend Permission Enforcement
- 실제 Activity Log Collection
- Monitoring Data Source
- Notification Delivery
- Settings Persistence

## H. Development Validation Backlog

### Confirmed from Code

- Angular 19 SPA와 11개 Menu Route
- Organization/User/Team/Product Access Shared Store
- Product/Provider/Model/Mapping Shared Store
- Usage/Cost의 동일 Usage Record
- Admin View/Manage 종속 규칙
- Settings Draft/Explicit Save
- Incident 상태와 Service Health 분리

### Assumed for Prototype

- Customer Account를 Organization으로 표현
- User는 한 Organization과 최대 한 Team에 소속
- Product Access 종료일만으로 자동 차단하지 않음
- Provider/Model 비활성화 시 기존 Mapping 보존
- Sample Provider Cost, Monitoring, Notification 상태

### Requires Team Review

- Dashboard Product Create와 Catalog Product Create 통합 UX
- Point Policy 적용 방식
- Usage Snapshot과 현재 Mapping의 관계
- Rate Card 상태 Activity 정책
- Component Showcase 위치
- 1024px 상세 Grid 전환점

### Requires Developer Validation

- 실제 Account/Organization/User/Team Schema
- 실제 Access Enforcement와 Product Status 차단
- 실제 Model Routing/Fallback/Priority
- Cost Precision, Currency, Rate Card Versioning
- Backend Permission Enforcement
- Audit/Activity 수집 및 보존
- Monitoring/Log/Incident 데이터 소스
- Notification Delivery와 Retry
- Settings 영속화와 Scope

## I. Recommended Next Actions

1. P1인 Dashboard Product Create의 데이터 모델과 책임을 팀에서 확정하고 ProductsStore 단일 흐름으로 통합한다.
2. 공통 Dialog Primitive에 Focus 이동/Trap/복원, Escape, Accessible Name을 한 번에 적용한다.
3. Store 계산 로직 중심의 작은 Unit Test를 추가해 `npm test`가 실제로 실행되게 한다.
4. Rate Card 상태 Activity와 Usage Snapshot 정책을 확정한다.
5. Bundle/Showcase SCSS Budget은 기능 QA와 분리한 성능·스타일 정리 작업으로 관리한다.

