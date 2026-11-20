# Activity History Draft

## 1. Document status

- Stage: AMS Redesign STEP I
- Status: team-review frontend prototype
- Updated: 2026-11-20
- Runtime: Angular 19, local Mock Data only

This screen lists sample administrative changes. It is not an audit log, a
security trail, or a record of real employee actions. The prototype clock is
2026-11-20 KST, the same clock used by Usage & Costs.

## 2. Activity History IA

- Route: `/activity-history`
- Sidebar group: Administration, after Admin & Permissions
- No detail route and no drawer. A wide dialog shows one event
- IA v1.1 stays at 6 groups and 11 menus
- Opening this page is not recorded as an activity
- API Usage requests and System Logs are not copied into this list
- Organization product-usage periods stay on the organization screen.
  `usage-recorded` events stay in that store and are left out of this list

Page title: `Activity History`

Description: `AMS 관리 화면의 설정 변경 이력을 조회합니다.`

Notice: `샘플 관리 활동 데이터를 보여 줍니다. 실제 감사 기록이 아닙니다.`

## 3. Page layout

1. Header with `새로고침` and `필터 지우기`
2. Three KPI cards
3. Date range, module, action, and actor filters
4. Search, page size, and the activity table
5. Activity detail dialog

Refresh rereads the in-memory stores. It does not call a server.
There is no CSV export. The project has no shared exporter that this page
can reuse without adding a new one.

## 4. Summary KPI

All three numbers use the current filter result, including the date range.
Pagination does not change them.

- Total Activities: matching events
- Unique Actors: distinct actor labels in that result. This is not an online
  or account-active count
- Affected Modules: distinct menus in that result

## 5. Search and filters

Date range, matched to the KST calendar day of each timestamp:

- Today
- Last 7 Days
- Last 30 Days, the default
- Custom Range

Other filters:

- Module: only menus that currently have at least one event
- Action: only categories present in the combined feed
- Actor: distinct actor labels
- Search: target name, target code, summary, actor, activity id

Filters combine. Changing one returns to page 1. The query string keeps the
non-default values, so browser Back restores the list.

Action categories are a display grouping. The original event type is kept as
`sourceAction` and is not replaced.

## 6. Activity table

Columns: Timestamp, Actor, Module, Action, Target, Summary, Actions.

Default sort is timestamp, newest first. Module, Action, and Actor can sort
too. Page size is 10, 20, or 50. The default is 20.

Timestamps render in KST. Actor `시스템` is the existing label for older
organization events that have no actor. `Demo Administrator` is the mock
actor for new prototype edits. `Luna Kim` remains on the original September
rate-card history row because that label was already stored. `Unknown Actor`
is used only when an actor id cannot be resolved.

Target names that still exist are links. The row and `상세` open the dialog.
There is no edit or delete action.

Empty copy when the stores have no events: `활동 기록이 없습니다.`

No-results copy: `조건에 맞는 활동이 없습니다.`

## 7. Activity detail

The dialog has four sections.

- Activity Information: id, time, actor, module, action, summary
- Target Information: type, name, id or code
- Changes: Field, Before, After
- Related Record: a link when the entity still exists

Closing the dialog stays on the same list state. The dialog is not a route,
so opening it does not reload the page.

## 8. Before and after

A change row is shown only when the source event stored a field, a previous
value, or a next value. Created events can have an empty Before, shown as
`—`. Removed events keep the previous value when the source stored one.

If the source has no before/after, the dialog says:

`이 이벤트에는 상세 변경 값이 없습니다.`

The page does not invent a diff for that event. One recent sample,
`activity-sample-9004`, is stored that way so the empty state can be reviewed.

Rate-card rows compare only prices that actually differ. Permission changes
recorded after this step store a readable menu list (`View` or
`View + Manage`). Older admin events keep the short labels they already had,
such as preset names.

Fields whose names look like a password, secret, API key, or token would be
masked as `••••`. The current samples do not contain those fields.

## 9. Related entity navigation

- Organization → `/organizations/:organizationId`
- User → `/users/:userId`
- Product, including mapping events → `/products/:productId`
- Provider → `/providers-models/providers/:providerId`
- Model → that provider's Models section, and the existing model dialog
  opens from the `model` query
- Plan → `/plans-points`
- Point Policy → `/plans-points?tab=point-policies`
- Rate Card → `/usage-costs?tab=rate-cards`
- Admin → `/admin-permissions` with the existing detail dialog opened from
  `view=detail`
- Preset → the Presets tab. That tab has no route that opens one preset
  dialog, so the link stops at the tab

`sample-activity-9001` points at `product-retired-sample`, which is not in
the catalog. The dialog says the related record is no longer available.
Deleted organizations and users are treated the same way: the event stays,
and the link is withheld.

Plan and policy links open the menu, not a new detail page.

## 10. Shared activity model

`ActivityFeed` reads the live stores. It does not keep a second copy of the
events.

- Organization and user events: `OrganizationsStore.activityLog`
- Product events: `ProductsStore.activityLog`
- Provider and model events: `ProductsStore.catalogLog`
- Plan and point-policy events: `PlansStore.activityLog`
- Rate-card price history: `UsageStore.history`
- Admin and preset events: `AdminStore.activities`
- One explicit missing-target sample inside the feed

Entity detail history still reads its own store, so the same organization,
product, and admin rows remain visible there. Product usage history is not
replaced by this feed.

## 11. Existing module records

Included:

- Organization create, update, team, product-access, and user events
- Product create, update, status, and mapping events
- Provider and model changes recorded from this step onward, plus three
  sample catalog rows
- Plan and point-policy sample rows, plus later saves
- Both rate-card history rows. Editing a card still appends history and does
  not recompute past request cost
- Admin account, permission, and preset events
- Incident create, update, status, severity, and assignee changes from System Monitoring
- Settings save events for General, Notifications, and Personal Preferences

Left out on purpose:

- `usage-recorded`
- API request rows
- Organization product-usage period rows
- System log rows, health samples, and incident timeline notes
- Settings edits that were cancelled, reset without saving, or failed validation
- Page views, searches, filters, cancelled dialogs, and failed validation

## 12. Recording rules

A new event is written only after validation succeeds and the shared record
changes.

- Provider, model, plan, and point-policy saves skip the event when no field
  changed
- Status actions that do not change status do not write an event
- Product, organization, user, rate-card, and admin flows keep the events
  they already wrote
- New organization events without a user actor use `Demo Administrator`
- Older organization rows without an actor label still show `시스템`
- Activity History does not write a second copy of an event that a module
  store already stored

## 13. Implemented interactions

- Date range, module, action, actor, search, sort, page size, and pagination
- Clear filters and refresh
- Detail dialog, before/after, missing changes, and missing target
- Links back to the existing management screens
- A later save in Products, Providers, Plans, Usage, Organizations, Users,
  Admin & Permissions, or System Monitoring shows up in this list without
  duplicating the source row
- An incident status change writes one activity row. The incident timeline is
  a separate record and is not copied into this list again
- A saved Settings change writes one row for the fields that actually changed.
  Cancel and an unsaved reset do not write a row

## 14. Provisional UX assumptions

- One global list and a wide dialog
- Last 30 days is the default
- Page size defaults to 20
- KST is the display timezone
- View and Manage permission text is a readable summary, not a security diff
- Preset edits that only stored the preset name do not gain a synthetic
  permission matrix
- The retired-product row exists only to show a missing target
- Sample dates were added inside the existing stores so entity history and
  this list share them. They are not confirmed operating history

## 15. Team review

- Which administrator actions should be recorded
- Whether read-only actions should be recorded
- How this list should differ from each entity's own history
- Which fields belong in before/after
- Who can see the full list
- Whether CSV export is required

## 16. Engineering checks

Left for a later build:

- Where the server creates the event
- How the signed-in actor is identified
- Event id and storage shape
- How before/after values are persisted
- Masking rules beyond the prototype field-name check
- Duplicate prevention across services
- Retention
- Integrity and tamper resistance
- Server timestamps and time zones
- Search and pagination at production volume
- Which administrators can read which events
