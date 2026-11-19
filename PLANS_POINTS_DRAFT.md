# Plans & Points Draft

## 1. Document status

- Stage: AMS Redesign STEP E
- Status: team-review frontend prototype
- Updated: 2026-11-19
- Runtime: Angular 19, local Mock Data only

This document describes the Plans & Points prototype used to discuss screen
structure, fields, and data shape. It does not define the operating plan
catalog, point math, assignment rules, renewal, billing, or Rate Cards.

Sample names, codes, points, durations, and rates are arbitrary review values.
They are not confirmed current AMS operating policy.

## 2. Plans & Points IA

- One menu: `/plans-points`
- Sidebar group: Product Management
- Tabs: `Plans` (default) and `Point Policies`
- Tab query: omit `tab` for Plans, `tab=point-policies` for Point Policies
- Legacy `/plans` redirects to `/plans-points`
- Legacy `/point-policies` redirects to `/plans-points?tab=point-policies`
- No Plan detail route and no Point Policy detail route
- Switching tabs replaces the query with that tab's default list state, so
  browser Back restores the previous tab and its filters
- Page size is fixed at 10, matching Organizations, Users, and Products. The
  spec mentioned a page-size control; this prototype does not add one

Plans and Point Policies stay separate records. This screen defines plans and
policies. It does not assign a plan to an organization, user, or product, and
it does not require a plan to reference a policy.

## 3. Plans tab

Page title: `Plans & Points`

Description: `서비스 플랜, 제공 포인트, 차감 정책을 관리합니다.`

Primary action: `플랜 추가`

Summary, calculated from the full plan collection:

- Total Plans
- Active Plans
- Inactive Plans

Search matches Plan Name and Plan Code. Filters are Status (`전체 상태`,
`활성`, `비활성`) and Plan Type (`Free`, `Trial`, `Point-based`,
`Unlimited`). Combined filters, sort, and pagination work on the same list.
`필터 지우기` appears when a search or filter is active.

Empty copy: `등록된 플랜이 없습니다.`

No-results copy: `조건에 맞는 플랜이 없습니다.`

## 4. Point Policies tab

Primary action: `정책 추가`

Summary, calculated from the full policy collection:

- Total Policies
- Active Policies
- Inactive Policies

Search matches Policy Name and Policy Code. Filters are Calculation Basis
(`USD-based`, `Token-based`, `Request-based`, `Unit-based`) and Status.
Unit-based rows still show the specific unit in the table, such as
`Unit-based · Page`. The filter value remains Unit-based.

Empty copy: `등록된 정책이 없습니다.`

No-results copy: `조건에 맞는 정책이 없습니다.`

## 5. Table columns

Plans:

1. Plan — name only, no logo
2. Plan Code
3. Plan Type
4. Granted Points
5. Duration
6. Request Limit
7. Status
8. Actions

Point Policies:

1. Policy — name and short description
2. Policy Code
3. Calculation Basis
4. Rate / Rule Summary
5. Status
6. Updated At
7. Actions

Row click and the menu item `수정` open the same edit dialog. The menu also
offers `활성화` or `비활성화`. There is no delete action.

`Unlimited` is the display for a null granted-points, duration, or request
limit. Numbers use en-US grouping and a unit (`Points`, `Days`, `RPM`,
`USD`). Status badges use the existing semantic styles: `활성`, `비활성`.

## 6. Form fields

Add and edit use a wide dialog. Cancel closes the dialog and discards the
draft. This matches the other management dialogs. There is no separate unsaved-
changes prompt.

### Plan

Basic Information:

- Plan Name, required
- Plan Code, required, unique case-insensitively, stored uppercase, immutable
  after create
- Description
- Plan Type, required
- Status

Point Allowance:

- Granted Points, required for Free, Trial, and Point-based
- Disabled, shown as Not Applicable, and stored as null for Unlimited

Usage Limits:

- Request Limit mode: RPM or Unlimited
- RPM, required and at least 1 when the mode is RPM

Duration & Status:

- Duration: 7 Days, 30 Days, Unlimited, or a custom day count of at least 1

The dialog states that the screen only defines the plan. It does not assign
the plan, renew it, or expire it.

Changing an active plan to inactive inside the dialog asks for confirmation on
the second save click. Deactivate from the row menu uses a confirmation
dialog. Activate does not ask for confirmation.

### Point Policy

Basic Information:

- Policy Name, required
- Policy Code, required, unique case-insensitively, stored uppercase,
  immutable after create
- Description
- Status

Calculation Basis, required:

- USD-based
- Token-based
- Request-based
- Unit-based

Calculation Settings, only for the selected basis:

- USD-based: USD Unit greater than 0, Points per USD Unit at least 0
- Token-based: Token Unit greater than 0, Input Points and Output Points at
  least 0
- Request-based: Points per Request at least 0
- Unit-based: Unit Type (`Page`, `Image`, `Minute`, `Slide`) and Points per
  Unit at least 0

Changing the basis clears the other basis fields before save. Unused numeric
fields are stored as null, so a previous basis cannot leak into the saved
policy.

Negative numbers are rejected. Empty required numbers are rejected. The
prototype does not add further operating validation.

## 7. Calculation Basis

| Basis | Stored fields | Rule summary example |
| --- | --- | --- |
| USD-based | USD unit, points per USD unit | `1,000 Points per 1 USD` |
| Token-based | Token unit, input points, output points | `80 / 160 Points per 1,000 Tokens` |
| Request-based | Points per request | `10 Points per Request` |
| Unit-based | Unit type, points per unit | `5 Points per Page` |

The summary is derived from the saved fields. It is not a separate stored
formula.

Preview is a local linear sample only:

- Request: points per request × sample requests
- USD: sample USD / USD unit × points per USD unit
- Token: sample input / token unit × input points, plus sample output / token
  unit × output points
- Unit: points per unit × sample units

Default samples are 2 USD, 1,000 input tokens, 500 output tokens, 5 requests,
and 3 units. Sample inputs are not saved. If a required number is missing, or
a unit is 0, the preview asks for the missing values instead of showing a
number. Preview does not read provider cost, Rate Cards, balances, or
transactions.

## 8. Mock interaction

Plans and policies:

- Search, combined filters, sorting, pagination
- Add, view/edit, activate, deactivate
- Required fields, unique code, non-negative numbers
- Confirmation before inactive
- Success toast
- Empty and no-results states
- Tab switch, direct URL entry, and browser history

Policy only:

- Basis selection replaces the visible settings
- Rule summary updates from the saved record
- Preview recalculates from the open form and the sample inputs

Status changes update the shared in-memory collection, the table, the rule
summary, and the KPI. They do not update organizations, users, products, or
any usage history.

## 9. Mock data structure

`PlansStore` is the only mutable source for this menu. It does not inject the
organization or product stores. Organizations, users, and products were not
given plan IDs or assignment fields.

`Plan`: id, name, code, description, type, status, grantedPoints, durationDays,
requestLimitRpm, createdAt, updatedAt.

`PointPolicy`: id, name, code, description, status, basis, and nullable fields
for the four bases (usdUnit, pointsPerUsdUnit, tokenUnit, inputPoints,
outputPoints, pointsPerRequest, unitType, pointsPerUnit), createdAt, updatedAt.

There is no Plan-to-Policy foreign key.

Seeded plans, all with `TMP-` sample codes:

| Name | Code | Type | Status | Granted Points | Duration | Request Limit |
| --- | --- | --- | --- | --- | --- | --- |
| Free | TMP-FREE | Free | Active | 100 Points | Unlimited | 10 RPM |
| Trial | TMP-TRIAL | Trial | Inactive | 1,000 Points | 7 Days | 30 RPM |
| Pro | TMP-PRO | Point-based | Active | 10,000 Points | 30 Days | 60 RPM |
| Pro+ | TMP-PRO-PLUS | Point-based | Active | 50,000 Points | 30 Days | 120 RPM |
| Enterprise | TMP-ENTERPRISE | Unlimited | Active | Unlimited | Unlimited | Unlimited |

Trial is inactive so the status filter and inactive KPI have a sample row.
That inactive state is sample data, not an operating decision.

Seeded policies:

| Name | Code | Basis | Sample rule | Status |
| --- | --- | --- | --- | --- |
| Sample USD | TMP-POLICY-USD | USD-based | 1,000 Points per 1 USD | Active |
| Sample Token | TMP-POLICY-TOKEN | Token-based | 80 / 160 Points per 1,000 Tokens | Active |
| Sample Request | TMP-POLICY-REQUEST | Request-based | 10 Points per Request | Active |
| Sample Page | TMP-POLICY-PAGE | Unit-based · Page | 5 Points per Page | Active |
| Sample Image | TMP-POLICY-IMAGE | Unit-based · Image | 20 Points per Image | Active |
| Sample Minute | TMP-POLICY-MINUTE | Unit-based · Minute | 15 Points per Minute | Inactive |

Sample Minute is inactive for the same review reason. No official plan code or
policy code was available, so every code uses the temporary `TMP-` prefix.

New records receive `plan-0001` or `policy-0001` style IDs. Created and updated
timestamps are local mock values.

## 10. Confirmed from the existing AMS discussion

- The menu name and route already exist in IA v1.1: Plans & Points under
  Product Management
- Historical plan names discussed for AMS include Free, Trial, Pro, Pro+, and
  Enterprise. This prototype uses them as sample labels only
- Historical consumption bases discussed include USD, token, request, page,
  image, audio/video minute, and slide
- Request limits were discussed in RPM-like terms
- Rate Cards were discussed as external provider API cost, separate from the
  internal point rule

None of those discussions confirmed that the names, codes, or numbers are the
current operating catalog.

## 11. New prototype proposals

- One page with two tabs instead of two menus or two detail routes
- Plan types Free, Trial, Point-based, and Unlimited as UI candidates
- Unlimited plan stores null allowance, duration, and request limit
- Unit-based as the shared basis for Page, Image, Minute, and Slide
- Separate input and output point rates for token rules
- A derived rule summary and an optional local linear preview
- Immutable sample codes after create
- Deactivate with confirmation, and no permanent delete
- Fixed page size of 10

## 12. Provisional UX assumptions

These are review assumptions, not approved requirements:

- A plan is a definition. This screen does not choose who receives it
- A policy is a definition. This screen does not choose which product, action,
  or plan uses it
- Unlimited means the corresponding number is not applicable in the form
- Duration is expressed in days, or as Unlimited
- Request Limit is a single RPM value, or Unlimited
- USD, token, request, and unit previews use direct linear multiplication
- Inactive is a catalog status only
- Cancel discards the open form
- Korean is used for descriptions, actions, filters, status, validation, and
  toasts. English is used for page title, tab labels, column titles, section
  titles, and domain nouns

## 13. To Be Reviewed

1. The real assignment unit for a plan: Organization, User, Product, or another
   unit
2. Whether a Plan and a Point Policy are linked, and in which direction
3. Who assigns or changes a plan in operation
4. What happens to an in-use plan, including existing point balances, when its
   definition changes
5. How the current AMS actually applies plans

Also unconfirmed:

- The real point calculation
- Plan duration, renewal, and expiry
- Whether a policy change rewrites past usage
- Policy versions and effective dates
- How a request limit is enforced
- How Rate Cards relate to a USD-based point policy
- Whether the sample plan names are still the operating catalog
- Whether codes, RPM, and day counts match any existing AMS field

## 14. Development team validation

- Keep Plan and PointPolicy as separate IDs and statuses until a relationship
  is confirmed
- Do not add plan assignment fields to organization, user, or product records
  until the assignment unit is confirmed
- Confirm whether plan code and policy code already exist. `TMP-` codes must
  be replaced if they do
- Confirm null versus a sentinel for unlimited points, duration, and RPM
- Confirm whether input and output tokens need different rates
- Confirm the unit list and whether audio and video minutes are one unit
- Confirm that status changes must not rewrite historical usage
- Replace the local preview if the confirmed formula is not linear
- Rate card maintenance belongs to Usage & Costs, not this form
