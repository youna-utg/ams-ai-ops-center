# Products Management Draft

## 1. Document status

- Stage: AMS Redesign STEP D
- Status: team-review frontend prototype
- Updated: 2026-11-19
- Runtime: Angular 19, local Mock Data only

This document describes the Products prototype used to discuss structure, UX,
and shared data. It does not define final product codes, Action Code ownership,
model routing, activation policy, access blocking, or deletion rules.

## 2. Products IA

- `/products`: Products List
- `/products/:productId`: dedicated Product Detail page
- Sidebar Products stays active on the detail page
- Breadcrumb: `Products / [Product Name]`
- Unknown Product ID shows a not-found state
- List query parameters `q`, `status`, `sort`, `direction`, and `page` stay on
  the detail URL and are restored when returning through the breadcrumb, the
  back link, or browser history
- Detail-only parameters are `tab`, `ai`, `mapQ`, `mapProvider`, `mapModel`,
  `mapStatus`, `historyAction`, `historyFrom`, and `historyTo`

Page size is fixed at 10, matching Organizations and Users. A page-size control
is not part of this prototype.

## 3. Products List

Header title is `Products`. The description is Korean:
`제품 정보, 운영 상태, AI 설정을 관리합니다.`
The primary action is `제품 추가`.

KPI cards are calculated from the shared product catalog:

- Total Products
- Active Products
- Inactive Products
- Maintenance Products

Search matches product name and product code. The status filter is 전체, 활성,
비활성, or 점검. Clear Filters appears when a search or status filter is set.
The table shows the filtered result through its rows and empty state.

Columns:

- Product: initial placeholder, name, short description
- Product Code
- Status
- Assigned Organizations
- Active Users
- Created At
- Actions: 상세, 수정, 상태 변경

Product name and row open the detail page. There is no Delete Product action.
There is no logo upload. The placeholder is a text initial because the current
project has no product logo asset or stable upload component.

## 4. Dedicated Product Detail Page

The detail page follows the Organization Detail pattern: header, summary, then
tabs. The header and summary stay in place while the tab content changes.

Header:

- Back link to the list
- Product initial and name
- Product code subtitle, marked as a temporary identifier
- Status badge
- 제품 수정
- 상태 변경

Summary:

- Assigned Organizations
- Active Users
- Active AI Mappings, with the LLM and Non-LLM split in the caption

Top tabs:

1. Overview
2. AI Configuration
3. Organizations
4. Activity

Default tab is Overview.

### Overview

Product information shows name, code, status, created date, last update, and
description. The configuration summary shows assigned organizations, active
users, and the count of active LLM and Non-LLM mappings. This screen does not
calculate API usage or provider cost.

### AI Configuration

Sub-tabs, visually nested under the top tabs:

- Providers (LLM)
- Providers (Non-LLM)

The mapping table columns are Action Code, Provider, Model, Status, Updated At,
and Action. Rows with the same Action Code stay together through the default
sort. Rows are not merged.

Filters: Action Code search, Provider, Model, and mapping status.

Actions: add, edit, activate or deactivate, and remove.

### Organizations

Read-only summary of assigned, active, and inactive organizations, plus a table
of organization, code, organization status, product access status, start date,
and end date. Organization name opens Organization Detail on its Products tab.
Access registration, end, and removal stay on that Organization screen.

### Activity

Columns: Timestamp, Action, Target, Previous, New, Updated By. Updated By is
`시스템` because this prototype has no signed-in operator. Filters are action
type and date range.

## 5. Product registration

Add Product collects only:

- Product name, required
- Product code, required
- Description, optional
- Initial status, required

Initial status defaults to Inactive. That default is a mock assumption, not an
operating policy. Provider and model mapping is configured after creation on
the detail page. A new product is added to the shared catalog and appears in
the Organization product selector. It is not assigned to every organization.

Edit Product can change name and description. Product code is read-only. Status
is not in the edit form. Cancel discards the dialog state. Save updates the
catalog, list, detail, and activity, then shows a toast.

## 6. Product status

Product status is separate from a customer's Product Access record.

- Active: the prototype treats the product as available for new work when the
  user, organization, and organization access are also active
- Inactive: the prototype treats new work as unavailable for every customer
- Maintenance: the prototype shows a maintenance state and treats new work as
  unavailable

Changing Active to Inactive or Maintenance asks for confirmation and says the
change affects new work for every customer. Organization Product Access records
are not rewritten. Reactivating a product does not restore an ended access.
The list badge, detail badge, active-user count, and User Detail effective
access read the same status.

No external request is blocked by this status change.

## 7. Action Code, Provider, and Model

The prototype relationship is:

`Product + Action Code + Provider + Model`

One Action Code can have several mappings. ChangeUp is seeded with two active
`SAMPLE_TRANSLATION` mappings so that case is visible. The same product, Action
Code, Provider, and Model combination cannot be saved twice.

LLM and Non-LLM mappings are separated by the Action Code kind and by the
provider and model kind. A provider from the other tab cannot be saved.

Sample catalog, not a confirmed company inventory:

- LLM providers: OpenAI, Anthropic, Google
- LLM models: gpt-4.1, gpt-4.1-mini, claude-sonnet, gemini-2.5
- Non-LLM providers: Sample Vision, Sample Speech
- Non-LLM models: sample-vision-1, sample-speech-1
- Action codes: `SAMPLE_TRANSLATION`, `SAMPLE_SUMMARY`, `SAMPLE_IMAGE`,
  `SAMPLE_SPEECH`

A mapping dialog can select an existing Action Code or type a new sample code.
A new code is stored in the shared catalog for that kind. The dialog does not
create providers or models.

## 8. Mapping management

Add and edit require Action Code, Provider, Model, and status. Changing the
provider clears the selected model, and the model list contains only models of
that provider and the current sub-tab.

Activate and deactivate update the table, the overview counts, and activity.
Remove asks for confirmation and deletes only that mapping. The provider and
model remain in the catalog.

This prototype does not implement model priority, automatic fallback, load
balancing, weighted routing, or failover. Several active mappings under one
Action Code are allowed, and the screen does not choose which one a real call
would use.

## 9. Organizations integration

Assigned Organizations counts distinct organizations whose Product Access for
that product is still active. An inactive organization is included. An ended or
removed access is not included. A passed end date does not remove the
relationship unless an operator ended it.

Active Users counts users who are active, belong to an active organization, and
whose organization still has active access, and only while the product itself
is Active. Inactive and Maintenance products show zero active users in this
prototype.

Organization Detail Products tab now shows Access and Product Status as
separate badges. The access badge remains 이용 중 or 종료. The product badge
reads the live catalog status.

## 10. Shared mock data

`ProductsStore` owns:

- products
- providers
- models
- action codes
- product mappings
- product activity

`OrganizationsStore` still owns organizations, teams, users, product access,
organization usage, user usage, and organization activity. Product access is
still keyed by product name. Renaming a product rewrites that name on access,
organization usage, and user usage so the relationship follows the product.
Organization activity sentences are not rewritten.

`OrganizationProduct` is a product name string so a newly registered product
can be selected when adding organization access. The original five names remain
the seed catalog. Their codes use a `TMP-` prefix because no official code rule
was confirmed.

User Detail effective access calls `ProductsStore.statusOf`. It no longer reads
the frozen `PRODUCT_CATALOG` constant. `PRODUCT_CATALOG` remains only as the
seed for the initial product statuses.

No new state-management library is used. Both stores are root signal services.

## 11. Mock interaction

Working in this prototype:

- Product search, status filter, sorting, pagination, and list-state restore
- Add, edit, and status change
- Detail tabs and LLM / Non-LLM sub-tabs
- Mapping search, filters, add, edit, activate, deactivate, and remove
- Organization navigation from the product Organizations tab
- Activity filters
- Validation, cancel, confirmation, toast, and empty states

Not represented as working controls:

- Product delete or restore
- Logo file upload
- Provider connection test, API key, or endpoint
- Model priority, fallback, load balancing, or failover
- Usage, cost, plan, or point calculation on this screen
- Real request blocking during Inactive or Maintenance

## 12. Provisional UX and policy assumptions

- Product Detail is a page, consistent with Organization Detail and User Detail.
- New products start as Inactive.
- Product code cannot change after creation.
- Codes shown here are temporary identifiers, not official codes.
- Product name is the current access key because existing access rows use the
  name.
- Multiple mappings per Action Code are visible and editable.
- The screen does not select a runtime model among those mappings.
- Inactive and Maintenance affect the effective-access label and the active-user
  count. They do not end customer access records.
- In-progress work is assumed to finish. The prototype has no job queue to
  demonstrate that.
- Mapping changes are local mock state only. Nothing is pushed to a running
  product.
- Actor is shown as 시스템.
- Page size stays at 10.

## 13. Team review

- Whether Product Detail should remain a page.
- Whether Inactive is the right default for a newly registered product.
- Whether the temporary `TMP-` code should be entered by an operator at all.
- Whether a product initial is enough until a logo store exists.
- Whether the Organizations tab should stay read-only.
- Whether several active mappings under one Action Code is understandable
  without a priority column.
- Whether Maintenance should be a product status or an operational notice.
- Whether product rename should be allowed while access is keyed by name.
- Whether product deletion should exist later, and what it would do to access
  history.

## 14. Development team validation

- Product code generation, uniqueness, and whether it can change.
- Who creates and retires Action Codes, and whether free-text entry is allowed.
- How many active mappings one Action Code may have.
- How a runtime call chooses a model when more than one mapping is active.
- How a mapping change is released to the running product.
- Which conditions are required before a product can become Active.
- How Inactive and Maintenance actually block product APIs.
- What happens to work already in progress.
- Product delete, restore, and retention of customer access history.
- Whether product identity should move from name to a stable product ID in
  Organization Product Access.
- Audit actor, time zone, and the immutable activity format.
- Where provider credentials and endpoints will live. They are intentionally
  outside this screen.
