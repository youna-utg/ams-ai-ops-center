# Usage & Costs Draft

## 1. Document status

- Stage: AMS Redesign STEP G
- Status: team-review frontend prototype
- Updated: 2026-11-20
- Runtime: Angular 19, local Mock Data only

This document describes the Usage & Costs prototype used to discuss how API
request volume, external provider cost, and model prices can be reviewed in
one menu. It does not define live request collection, provider billing, rate
calculation, revenue, margin, points, invoices, budgets, or alerts.

Sample request IDs, costs, prices, and error messages are review values. They
are not confirmed operating policy and they are not production logs.

## 2. Usage & Costs IA

- One menu: `/usage-costs`
- Sidebar group: AI Operations, after Providers & Models
- Tabs: `API Usage` (default), `Cost Analytics`, `Rate Cards`
- Query: omit `tab` for API Usage, `tab=cost-analytics`, `tab=rate-cards`
- Legacy redirects: `/api-usage`, `/cost-analytics`, `/rate-cards`
- No request detail route and no rate-card detail route. Both use dialogs
- IA v1.1 stays at 6 groups and 11 menus. These three areas are not separate
  sidebar items

Page title: `Usage & Costs`

Description: `API 사용량, 외부 Provider 비용, 단가 정보를 확인합니다.`

API Usage and Cost Analytics share the analysis filters: date range, product,
provider, and model. Request status applies only to API Usage. Changing tabs
does not clear those filters. Rate Cards keeps its own search, provider,
model, billing unit, status, and effective-date filters.

The prototype clock is the fixed KST date `2026-11-20` (`USAGE_CLOCK`).
`Today`, `Last 7 Days`, and `Last 30 Days` are calculated from that date, not
from the machine clock. Last 7 Days is the clock date and the 6 days before
it. Last 30 Days is the clock date and the 29 days before it. Custom Range is
inclusive. Timestamps are stored with a `+09:00` offset and displayed in
`Asia/Seoul`. This timezone choice is provisional.

## 3. API Usage

Purpose: review request volume, success and error mix, token totals, and
response time, then open one request.

KPI, charts, and Request History use the same filtered request set. An empty
set shows `—` for rates and average response time. The prototype does not
invent a 0% rate.

KPI:

- Total Requests: count of filtered requests
- Success Rate: success count / total
- Error Rate: error count / total
- Input Tokens: sum of input tokens. Null token fields count as 0 in the sum
- Output Tokens: sum of output tokens
- Avg. Response Time: mean `latencyMs` of the filtered requests

The only request statuses in this prototype are `success` and `error`. There
is no third status in the denominator. Error Rate and Success Rate therefore
add to 100% when the set is not empty.

Filters:

- Date Range: Today, Last 7 Days, Last 30 Days (default), Custom Range
- Product, Provider, Model, Request Status
- Choosing a provider limits the model list to that provider and clears a
  model that does not belong to it
- `필터 지우기` returns the range to Last 30 Days and clears the other filters

Charts reuse `app-chart` and the existing chart color tokens:

- API Requests Trend: success and error counts
- Token Usage Trend: input and output tokens
- Error Rate Trend: error count / bucket count, in percent

Granularity is automatic. Today, or any span of 2 days or less, is hourly.
A span longer than 62 days is weekly, starting Monday. Everything else is
daily. The active unit is labeled `Hourly`, `Daily`, or `Weekly`. There is no
separate granularity control.

Request History columns: Timestamp, Request ID, Product, Provider, Model,
Input Tokens, Output Tokens, Latency, Status, Actions.

Request IDs look like `req_000001`. They are mock IDs. Product and Provider
names are links to the existing detail routes. Model is text. Non-LLM rows
store null tokens and display `—`. Latency under 1000ms is shown in
milliseconds; 1000ms and above is shown in seconds. Status badges are `성공`
and `오류`. The row action is `상세`. Row click opens the same dialog. Clicks
on a link or button do not.

Sort, pagination, and page size 10 / 20 / 50 are available. The default page
size is 20. Empty copy: `표시할 요청이 없습니다.` No-results copy:
`조건에 맞는 요청이 없습니다.`

## 4. API Request Detail

The detail is a wide dialog. Closing it leaves the list filters and page in
the URL.

Header: Request ID, timestamp, status badge.

Sections:

- Request Information: Request ID with `복사`, Product, Provider, Model,
  Timestamp (KST), Request Status
- Token Usage: Input, Output, Total. Both null values stay `—`
- Performance: Latency, HTTP Status Code, Error Category, Error Message.
  Success rows show `—` for the error fields
- Cost: Estimated Provider Cost and Currency `USD`. The amount is the stored
  `costUsd` on that request
- Preview: only `[Masked sample request content]` and
  `[Masked sample response content]`

Sample error categories, not a confirmed taxonomy:

- Authentication Error, HTTP 401, stored cost 0
- Rate Limit, HTTP 429
- Timeout, HTTP 504, longer sample latency
- Provider Error, HTTP 502
- Invalid Request, HTTP 400

P95 and max latency are not shown.

## 5. Cost Analytics

This tab sums the same `ApiUsageRecord.costUsd` values. The amount is a mock
external provider cost in USD. It is not a customer charge, revenue, margin,
point deduction, or invoice.

Request status is ignored here, even if API Usage has a status selected.

KPI:

- Total Provider Cost: sum of `costUsd` in the current filter
- Cost Change: current total compared with the immediately previous window of
  the same length. The label is `N/A` when that previous window has no
  records or its total is 0. The percent is not hardcoded
- Top Cost Product
- Top Cost Provider

Charts:

- Provider Cost Trend, wide
- Cost by Product, bar
- Cost by Provider, doughnut
- Cost by Model, bar

A chart includes only products, providers, or models that appear in the
filtered records. Clicking a chart does not change the filter.

## 6. Cost Breakdown Table

Rows are grouped by `productId + providerId + modelId`.

Columns: Product, Provider, Model, Requests, Input Tokens, Output Tokens,
Provider Cost, Cost Share.

Cost Share is the row cost divided by the filtered total. The displayed
percent can differ by rounding. The unrounded row costs are what the table
total adds. The toolbar total uses that same sum, so it matches Total
Provider Cost for the same filter.

Product opens Product detail. Provider opens Provider detail. Model stays
text because STEP F has no model route. Sort and pagination are available.
Page size is fixed at 10.

## 7. Rate Cards

Rate Cards are provider prices. They are not Point Policies and they are not
edited from Plans & Points.

Primary action: `Rate Card 추가`

Search matches the current Provider name and Model name. Filters: Provider,
Model, Billing Unit, Status, and an effective-date from/to pair. The model
list follows the selected provider. `필터 지우기` clears this tab only.

Columns: Provider, Model, Billing Unit, Input Price, Output Price, Currency,
Effective Date, Status, Actions.

Billing units in this prototype:

- `1M Tokens` and `1K Characters` use Input Price and Output Price
- `Request`, `Image`, `Audio Minute`, and `Page` use one Unit Price. The
  table shows that amount in the Input Price column with a `Unit` caption.
  Output Price stays `—`

Currency is fixed at USD. There is no exchange conversion.

Status is `활성` or `비활성`. In this prototype, status is independent of
Effective Date. Overlapping effective dates are allowed and are not resolved.
Both choices are provisional.

Actions: `상세`, `수정`, `활성화` / `비활성화`. There is no delete. Deactivate
asks for confirmation. Activate does not. Status changes do not add a pricing
history row.

Empty copy: `등록된 Rate Card가 없습니다.`

No-results copy: `조건에 맞는 Rate Card가 없습니다.`

Page size is fixed at 10.

## 8. Rate Card Detail and history

The add/edit dialog has Provider & Model, Pricing Configuration, and
Effective Date. A new card also chooses the initial status. The default is
`활성`, which differs from the inactive default used by other masters. That
default is provisional.

Validation:

- Provider, Model, Billing Unit, and Effective Date are required
- The prices required by the billing unit are required
- Negative prices are rejected. Zero is allowed
- Prices stay decimal values. They are not rounded to integers

On edit, Provider and Model are read-only so the history remains on the same
card. Changing the billing unit, a price, or the effective date updates the
current card and appends one history row. The actor shown is the existing
demo header persona, `Luna Kim`.

Detail sections: Basic Information, Current Pricing, Pricing History.
History columns: Effective Date, Previous Price, New Price, Updated At,
Updated By. Seed history exists for `rate-0001`: input/output `2.5 / 10`
changed to `2 / 8` on `2026-09-01`.

Editing a rate card does not recalculate `costUsd` on existing requests.
Whether a future system should recompute past cost is undecided.

## 9. Shared Mock Data relationships

`UsageStore` is a separate root store. It holds `ApiUsageRecord`, `RateCard`,
and `RateCardHistory`. It does not own products, providers, or models.

Request and rate-card rows store IDs:

- `productId`, `organizationId`, `userId`, `providerId`, `modelId`,
  `actionCodeId`, `appliedRateCardId`

Displayed names are read from `ProductsStore` at render time. Renaming a
provider or model in that catalog changes the name shown here. The request
still points at the same IDs.

The sample log has 90 deterministic records, two per KST day, for 45 days
ending on `2026-11-20`. The generator seed is `20261120`. Lanes use the
existing ChangeUp, TimeUp, DeckUp, DocUp, and MatchUp product IDs, the
existing provider and model IDs, and organization `org-0001` through
`org-0005` with the matching `user-0005-01` style user IDs. About 16% of
rows are errors. Token rows store a cost snapshot from the seeded per-1M
prices. Non-LLM rows store a small unit cost and null tokens.

Seeded rate cards are `rate-0001` through `rate-0006`, all active, effective
`2026-09-01`, currency USD. New IDs continue from the highest digit run, so
the next card is `rate-0007`.

Two existing datasets are intentionally separate:

- Dashboard `overview.mock.ts` (`PRODUCTS`, `TREND_DATA`, `COST_BY_PROVIDER`,
  `COST_BY_MODEL`) is a summary demo. Its numbers are not aggregates of
  `ApiUsageRecord`, and this step does not change that dashboard
- Users → Usage still reads `UserUsageRecord` from `OrganizationsStore`.
  Those rows are daily aggregates keyed by product, provider, and model
  name strings, dated `2026-10-18` and `2026-11-09`. They are not a filter
  of this request log. The Users screen was not rewritten

## 10. Implemented interactions

- Main tab switching without clearing the other tab's query state
- Shared date range and product, provider, and model filters
- API Usage status filter, KPI, three charts, sortable request table,
  page size, pagination, empty and no-results states, request dialog, and
  Request ID copy
- Cost Analytics KPI, four charts, sortable breakdown, pagination, and
  product/provider links
- Rate Card search, filters, sort, pagination, add, edit, detail, activate,
  deactivate confirmation, pricing history, validation, and success toast
- Responsive stacking at 1280px and 1024px. Wide tables scroll inside the
  card. Dialogs scroll inside the dialog when they exceed the viewport

## 11. Provisional UX assumptions

- One sidebar item and three tabs is the review structure, not a final IA
- API Usage and Cost Analytics share one date range. Rate Cards uses
  effective dates instead
- The prototype clock stays on 2026-11-20 KST
- Request status is only success or error
- Error categories are the five sample labels above
- New rate cards default to active
- Provider and Model cannot be changed after create
- Active and inactive are independent of the effective date
- Overlapping rate cards are not auto-resolved
- Past request cost is a stored snapshot
- Masked preview text stands in for any request or response body
- Chart clicks do not apply filters
- Page size is 20 by default only for Request History. Breakdown and Rate
  Cards stay at 10, matching the other list screens

## 12. Team review and engineering checks

These items are not decided by this prototype:

- How real API request logs would be collected
- What counts as usage for each product
- Where a real external provider cost figure would come from
- The billing-unit taxonomy and the price fields each unit needs
- Fee types beyond input price, output price, and a single unit price
- Whether a rate-card change should recompute past request cost
- How request timestamps and time zones should be stored and displayed
- How error categories should be classified
- How sensitive request and response content should be masked or omitted
- How User Usage aggregates should relate to the request log
- Whether external provider cost can be aggregated in real time

Also left for a later build, and not implemented here:

- Live provider calls, pricing APIs, invoices, revenue, margin, points,
  budgets, alerts, anomaly detection, and monitoring backends
- Database storage, authentication, and API key storage
- P95 or max latency
- Automatic selection among overlapping rate cards
- Rewriting Dashboard or Users so their existing samples match this log
