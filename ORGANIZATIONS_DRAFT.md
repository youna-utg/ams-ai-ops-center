# Organizations Management Draft

## 1. Document status

- Stage: AMS Redesign STEP B
- Status: team-review frontend prototype
- Updated: 2026-11-19
- Runtime: Angular 19, local Mock Data only

This document describes the prototype implemented for UX and development
review. It does not define final service policy, backend validation, access
control, deletion retention, or contract enforcement.

## 2. Information architecture

- `/organizations`: Organizations List
- `/organizations/:organizationId`: Organization Detail
- Detail tabs: Overview, Teams, Users, Products, History
- History sub-tabs: Product Usage History, Organization Activity

List search, filters, sorting, page, and page size use query parameters. Detail
tabs add their parameters while retaining list parameters, so returning to the
list restores its state.

## 3. List page

### Sections

1. Page header and Add Organization
2. Total, Active, and Inactive Organization KPI cards
3. Name/code search, Status and Product filters, Clear Filters
4. Organizations data table
5. Page-size selector and pagination

### Table columns

- Organization
- Code
- Status
- Users
- Teams
- Products
- Contract End
- Created
- Actions

Deleted organizations are excluded from the list and KPI cards. Counts derive
from the same Team, User, and Product Access collections used by detail pages.

### List interactions

- Combined search and filters
- Column sorting
- 10 / 20 / 50 page size
- Pagination
- Organization name and row detail navigation
- View, Edit, Activate/Deactivate, Delete action menu
- Empty-data and no-results states

## 4. Organization detail

The header shows organization name, code, status, edit, status change, and
delete actions. Summary cards show Total Teams, Total Users, and Active
Products.

### Overview

- Organization Information
- Contact information
- Contract start/end and contract state
- Memo
- Edit Organization

Organization status and contract status are separate. An expired contract does
not automatically change organization status in the prototype.

### Teams

- Columns: Team Name, Members, Created At, Actions
- Add Team
- Edit Team
- Delete Team
- View Members

View Members switches to the Users tab with the selected team filter. The mock
policy blocks team deletion while members remain assigned.

### Users

- Columns: User, Email, Team, Status, Joined At, Last Login
- Search by name/email
- Team filter
- Status filter
- Unassigned state

The STEP B prototype provides no User Detail link.

### Products

- Current and ended Product Access lists
- Product, status, seat limit, start date, end date, actions
- Add Product Access
- Edit dates
- End Usage
- Remove Product
- Reuse ended Product Access

Only one active access for the same product is allowed. A new start date may be
today or in the past. End dates are optional and do not automatically end
access. Organization deactivation does not rewrite product records.

### History

Product Usage History and Organization Activity remain separate sub-tabs and
tables.

Product history combines product-access events and sample usage records. It
supports product and keyword filtering.

Organization Activity records organization, team, and product access changes.
It supports activity-type and keyword filtering.

## 5. Forms

### Organization

- Organization Name
- Organization Code (generated and read-only)
- Contact Person
- Contact Phone
- Contract Start Date
- Contract End Date
- Memo

The detail edit form also exposes existing optional industry, description,
email, and address mock fields. Name and contract start are required. End date
cannot precede start date.

### Team

- Team Name
- Description
- Member assignment

### Product Access

- Product
- Seat Limit
- Start Date
- End Date

## 6. Search and filters

List query parameters:

- `q`
- `status`
- `product`
- `sort`
- `direction`
- `page`
- `pageSize`

Detail query parameters:

- `tab`
- `team`
- `userQ`
- `userStatus`
- `historyTab`
- `historyProduct`
- `historyType`
- `historyQ`

## 7. Mock data structure

- Organization
- OrganizationTeam
- OrganizationUser
- OrganizationProductAccess
- OrganizationProductUsage
- OrganizationActivity

Relationships use IDs. `OrganizationsStore` is the only mutable state source.
The initial sample includes 16 organizations, one logically deleted
organization, mixed status and contract dates, teams, users, product access,
usage, and activity.

## 8. Implemented feedback

- Typed reactive form validation
- Confirmation dialogs
- Success toasts
- Disabled pagination controls
- Empty data and no-results states
- Not Found detail state
- Semantic status badges
- Horizontal table overflow at reduced widths

## 9. Prototype assumptions

- New organizations start Active.
- Organization codes are generated as `ORG-####`.
- Deletion is logical and removed records are not recoverable through this UI.
- A user belongs to at most one team in an organization.
- Teams with assigned members cannot be deleted.
- A product may have one active access period per organization.
- Deactivation describes an access limitation but does not modify user account
  status or product records.
- Store state resets after browser refresh.

These assumptions are implementation aids and are not approved service policy.

## 10. Out of scope

- Backend API and database
- Authentication and authorization enforcement
- Actual customer/product access blocking
- User Detail은 Users 메뉴에서 구현한다. 사용자 원본은 Organizations store의 동일 배열이다.
- Product master or Provider/Model configuration
- Billing, revenue, payment, and invoicing
- Real audit-log infrastructure
- Deleted-organization recovery
- Email and notification delivery

## 11. To be reviewed

- Organization and contract lifecycle
- Required contact fields and formats
- Team membership and deletion policy
- Product removal versus usage ending semantics
- Expiration and renewal behavior
- Deleted record retention and recovery
- Activity retention, export, and sensitive-value masking
- Permission rules for each action

## 12. Development team validation items

- Final API resource shapes and pagination contract
- Server-side search, filter, and sort parameters
- Optimistic update and error rollback behavior
- Code generation ownership and uniqueness
- Date/time zone rules
- Concurrency and stale-edit handling
- Audit-event source and immutable history format
- Backend authorization for status and destructive actions

## 13. Shared user data

Users 화면은 이 store의 `users` 배열을 그대로 사용한다. 사용자 추가, 소속 변경, 팀 변경, 상태 변경, 논리 삭제는 Organization의 사용자 수와 Team member count에 같은 상태로 반영된다. 사용자별 제품 권한은 만들지 않으며 제품 접근은 Organization의 Product Access를 따른다. 과거 이용 기록은 사용자가 고객사를 옮겨도 기록 당시의 Organization에 남는다.

Products 화면은 제품 카탈로그와 전역 상태를 `ProductsStore`에 둔다. Organization의 Product Access 기록은 그대로 이 store에 남고, 제품 상태만 바꿔도 종료되거나 복구되지 않는다. 제품명 변경은 접근, 이용 기록, 사용자 이용 기록의 제품명을 같은 값으로 갱신한다. Products 탭은 이용 상태와 제품 전역 상태를 따로 보여 준다. 제품 선택 목록은 공유 카탈로그를 읽는다.

## 14. Relationship to IA v1.1

`IA_DRAFT.md` remains the parent IA document. This file expands only the
Organizations destination and can change independently during team review.
