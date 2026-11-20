# AMS Redesign — Team Review Guide

검토 기준일: 2026-11-20

## 1. 프로젝트 목적

AMS(AI Ops Center)는 고객사, 사용자, Product, AI Provider/Model, 사용량/비용, 관리자 권한, 이력, Monitoring, 설정 흐름을 검토하기 위한 Angular 19 Frontend Mock Prototype이다.

이 시연의 목적은 운영 정책을 확정하거나 실제 시스템 연결을 증명하는 것이 아니다. IA v1.1의 사용자 흐름, 화면 구조, Shared Mock Data 관계와 개발 전 확인 질문을 팀이 함께 검토하는 것이다.

## 2. IA v1.1 메뉴 구성

- OVERVIEW
  - Dashboard
- CUSTOMER MANAGEMENT
  - Organizations
  - Users
- PRODUCT MANAGEMENT
  - Products
  - Plans & Points
- AI OPERATIONS
  - Providers & Models
  - Usage & Costs
- ADMINISTRATION
  - Admin & Permissions
  - Activity History
- SYSTEM
  - System Monitoring
  - Settings

총 6개 Group, 11개 Menu다. 이번 리뷰에서 Sidebar IA를 변경하지 않는다.

## 3. 주요 기능 요약

### Customer Management

- Organization, Team, User, Product Access를 메모리 Shared Store에서 관리한다.
- Organization/User 전용 Detail Page에서 관련 Entity와 History를 조회한다.
- User Bulk Import는 CSV만 지원하며 XLSX는 지원하지 않는다.

### Product & AI Operations

- Product 전용 Detail Page에서 Action Code별 복수 Provider/Model Mapping을 관리한다.
- Provider는 전용 Detail Page, Model은 Detail Dialog를 사용한다.
- Provider/Model을 비활성화해도 기존 Mapping Record는 유지한다.

### Usage & Costs

- API Usage와 Cost Analytics는 동일 Usage Record를 사용한다.
- Request Detail, Cost Breakdown, Rate Card/Pricing History를 Mock Data로 조회한다.
- 실제 AI Request 실행이나 실제 Billing 결과가 아니다.

### Admin & Activity

- 메뉴별 View/Manage Matrix, Preset, Custom Permissions를 검토한다.
- Manage는 View를 포함하고 View 해제 시 Manage도 해제된다.
- 실제 인증, Route Guard, Backend Permission Enforcement는 없다.
- Activity History는 각 Feature Store의 Mock Activity를 통합한다.

### Monitoring & Settings

- Health, Logs, Incidents는 명시적 ID 관계를 가진 Sample Monitoring Data다.
- Incident 해결은 Service Health를 자동 변경하지 않는다.
- Settings 3개 Tab은 Draft 후 명시적 Save를 사용한다.
- 실제 Monitoring, Notification Delivery, 서버 저장은 없다.

## 4. Mock Data 및 Frontend Prototype 범위

- 모든 변경은 Browser Memory에만 유지되며 새로고침하면 초기화된다.
- Provider Endpoint/API Key는 실제 연결 정보가 아니다.
- Usage, Cost, Health, Log, Incident, Notification 값은 Sample이다.
- 실제 Customer/User 개인정보, 실제 Credential, 실제 결제 데이터는 포함하지 않는다.
- 현재 권한 화면은 관리 UX 제안이며 실제 접근을 차단하지 않는다.
- Plans는 정의만 관리하며 Organization/User/Product Assignment는 범위 밖이다.

리뷰 중 “동작한다”는 표현은 Frontend Mock State 안에서의 동작을 뜻한다.

## 5. 대표 시연 시나리오

### Scenario 1 — Customer Onboarding

1. Organizations에서 Organization 생성
2. Organization Detail에서 Team 생성
3. Users에서 User 등록 및 Organization/Team 선택
4. Organization Detail에서 Product Access 추가
5. Organization Detail의 Users/Products 확인
6. User Detail의 Product Access와 실효 상태 확인

검토 포인트:

- User/Team Count가 같은 Shared State를 반영하는가?
- User, Organization, Product 상태를 각각 표시하는가?
- 과거 Product Access History를 삭제하지 않는가?

### Scenario 2 — Product AI Configuration

1. Providers & Models에서 Provider 등록
2. Model 등록
3. Products의 Product Detail로 이동
4. AI Configuration에서 Action Code Mapping 추가
5. Product Status 변경
6. Provider/Model/Product Mapping 상태를 각 화면에서 확인

검토 포인트:

- 하나의 Action Code에 여러 Mapping이 필요한가?
- 실제 Routing Priority/Fallback은 어떤 계층에서 결정하는가?
- Product 비활성화가 실제 API 요청을 즉시 차단해야 하는가?

### Scenario 3 — AI Usage & Costs

1. API Usage에서 Last 30 Days 선택
2. Product/Provider/Model Filter 적용
3. Request Detail 확인
4. 같은 Filter로 Cost Analytics 이동
5. Request Count, Total Provider Cost, Breakdown 합계 비교
6. Rate Cards와 Pricing History 조회

검토 포인트:

- Usage Record가 당시 Rate Card/Mapping의 Snapshot이어야 하는가?
- Currency와 소수점 Precision 기준은 무엇인가?
- 현재 Mapping과 과거 Usage가 다를 때 어떤 안내가 필요한가?

### Scenario 4 — Admin Permissions

1. Admin 등록
2. Preset 지정
3. View/Manage Matrix 확인
4. Custom Permissions로 전환해 변경
5. 원본 Preset이 유지되는지 확인
6. Activity History 확인

검토 포인트:

- Preset 수정이 연결 Admin에게 즉시 반영되어야 하는가?
- Custom 전환 후 Preset 연결을 완전히 해제하는가?
- Backend Enforcement 단위가 현재 11개 Menu와 같은가?

### Scenario 5 — Incident Management

1. System Monitoring → Health에서 저하 Service 확인
2. Service Detail에서 Related Logs/Incidents 확인
3. Incident Detail 열기
4. Incident를 Resolved로 변경
5. Timeline Event 확인
6. Health로 돌아가 Service 상태가 자동 Healthy가 되지 않음을 확인

검토 포인트:

- Health 판정의 실제 Data Source와 주기는 무엇인가?
- Incident와 Log 연결을 누가/어떻게 생성하는가?
- Incident 상태 Workflow와 필수 승인 단계가 있는가?

### Scenario 6 — Settings

1. General에서 Timezone 변경
2. Unsaved 표시 확인
3. Cancel로 복원
4. Notifications Rule 변경
5. Save Changes
6. Activity History에서 저장 Event 확인

검토 포인트:

- System Setting과 개인 Preference의 저장 Scope는 무엇인가?
- Navigation Warning 대상과 예외는 무엇인가?
- 실제 Notification Channel 연결/검증은 어디에서 수행하는가?

## 6. 팀원에게 확인할 핵심 질문

### UX / Product

- Dashboard의 Product 추가를 유지할 것인가, Products 메뉴의 단일 생성 흐름으로 통합할 것인가?
- Component Showcase를 Dashboard 하단에 둘 것인가, 개발용 별도 접근 경로로 분리할 것인가?
- 1024px Organization Detail은 2열을 유지할 것인가, 1열로 전환할 것인가?
- Dialog Detail과 전용 Detail Page 구분이 현재 업무 빈도에 맞는가?
- Rate Card 상태 변경을 Activity History에만 기록할지 Pricing History에도 표시할지?

### Operating Policy

- User는 여러 Team에 속할 수 있는가?
- Product Access 종료일 경과 시 자동 차단해야 하는가?
- Product/Provider/Model 비활성화가 기존 Mapping과 실제 Request에 미치는 영향은 무엇인가?
- Plan과 Point Policy의 연결/적용 대상은 무엇인가?
- Preset 수정은 연결 Admin에게 즉시 반영되어야 하는가?

## 7. 개발팀 검토가 필요한 항목

### Requires Developer Validation

- 실제 Customer Account와 Organization Schema
- Organization/User/Team Cardinality와 Lifecycle
- OrganizationProductAccess 저장/평가 방식
- Product Status와 실제 API Gateway 차단
- Action Code별 Multi Provider/Model Routing, Priority, Fallback
- Provider Cost 계산 Precision과 Rate Card Versioning
- Point Policy 적용 Engine
- Backend Permission Enforcement
- Actual Activity/Audit Log 수집과 보존
- Monitoring/Log/Incident Data Source
- Notification Delivery/Retry/Failure 처리
- Settings Persistence, Scope, 동시 수정

### 현재 코드에서 확인된 사항

- Organization/User/Team/Product Access는 같은 OrganizationsStore를 사용한다.
- Product/Provider/Model/Mapping은 같은 ProductsStore를 사용한다.
- Usage/Cost는 같은 Usage Record를 사용한다.
- View/Manage 종속 규칙은 Frontend에서 보장한다.
- Settings는 Draft 후 Save한다.
- Incident Status와 Service Health는 독립 상태다.

### Prototype 가정

- Customer Account는 Organization으로 표현한다.
- User는 한 Organization과 최대 한 Team에 속한다.
- Product Access 종료일만으로 자동 차단하지 않는다.
- 비활성 Provider/Model의 기존 Mapping은 보존한다.
- 화면의 Cost/Health/Notification 값은 Sample이다.

## 8. 다음 단계 추천

1. Dashboard Product Create의 책임과 Catalog Product 모델을 먼저 확정한다.
2. 공통 Dialog 접근성(Focus, Escape, ARIA) 개선을 하나의 작업으로 수행한다.
3. Shared Store의 핵심 관계/KPI 계산에 작은 Unit Test를 추가한다.
4. Usage Snapshot, Rate Card History, Activity 정책을 확정한다.
5. 개발 검증 항목을 Backend/API 설계 입력으로 전환한다.

상세 Issue, 수정 파일, Build/Test 결과는 `INTEGRATED_QA_REPORT.md`를 참조한다.

