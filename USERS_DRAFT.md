# Users Draft

This note describes the current Users prototype. The behaviors below are
draft assumptions for team review, not approved service policy.

## 1. Users IA

- List: `/users`
- Detail: `/users/:userId`
- Bulk import: `/users/import`
- Sidebar Users opens the list. The name opens the detail.
- Breadcrumb: `Users / [User Name]` or `Users / 일괄 등록`
- Browser history is preserved. Returning to the list keeps search, organization,
  team, status, registration type, sort, and page in the URL.
- Unknown or deleted user IDs show a not-found state.
- Page size stays at 10, matching the current Organizations table. A page-size
  selector was not added.

## 2. Users List

Header title `Users`, Korean description, secondary bulk-import action, and
primary add action. KPI cards are Total, Active, and Inactive. Deleted users
are excluded. Search covers name and email. Filters combine organization, team,
status, and registration type. Team options belong to the selected organization
and include `미지정`. The team filter is disabled until an organization is
selected. The table shows user and email together, organization, team, status,
registration type, joined date, and last login. Empty login is `없음`.

## 3. User Detail

Header shows the name, email, status, edit action, and more actions. Summary
cards show organization, team, and the count of products the organization can
currently access. Tabs are Overview, Product Access, Usage, and History.
Overview links the organization name to Organization Detail. If the
organization is inactive, the account status stays separate from the access
note `Restricted by Organization`.

## 4. Form fields

Required: full name, email, organization. Optional: team, phone, job title.
Changing organization clears the selected team. A user has one organization and
at most one team in this prototype. Email is unique across mock users,
including case differences. New users start Active. Manual creation records
`manual`; CSV import records `bulk`.

## 5. Table columns

List: User, Organization, Team, Status, Registration, Joined At, Last Login,
Action. Product access: Product, Organization Access, Product Status,
Expiration, Effective Access. Usage: product totals and recent date, product,
provider, model, requests, cost. History: timestamp, action, field, previous,
new, updated by.

## 6. Filters

List filters are stored in the URL and can be cleared together. Usage filters
are date range and product. History filters are date range and action type.
These detail filters are separate from account history and are removed from the
list URL when returning.

## 7. Bulk import workflow

The flow is a wide page: upload, preview with inline correction, and result.
Only CSV is parsed. XLSX is explicitly unsupported so this prototype does not
add a spreadsheet library. A CSV template can be downloaded. Validation checks
required name, email, and organization code, email format, unknown
organization, unknown team, existing email, and duplicate email inside the file.
Import is all-or-nothing. The button stays disabled while any row is invalid.
No file is uploaded to a server and no error file is downloaded.

## 8. Shared mock data relationships

Users, teams, organizations, product access, user usage, and activity stay in
`OrganizationsStore`. Users pages do not keep a second user array. Adding a
user increases the organization user count. Moving a user updates both
organization counts and clears an invalid team. Team member counts follow
`memberIds`. Deactivation changes the user badge without changing the
organization. Logical delete hides the user and keeps activity. Usage records
remain attached to the organization stored on each record. Effective product
access reads the live product status from `ProductsStore`, so a product status
change is visible here without rewriting organization access.

## 9. Mock interaction

Create, edit, activate, deactivate, and delete update the same signal state and
show a toast. Status and delete actions ask for confirmation. Edit and status
changes append user activity with the previous and next value. Product access
is read-only and links to the organization Products tab. Users without usage
records see an empty state.

## 10. Provisional UX assumptions

- Account status and organization access are separate.
- Effective access is available only when the user, organization, organization
  product access, and product catalog status are all active.
- A passed end date shows a warning while access remains until an administrator
  ends it.
- Maintenance means new work is unavailable.
- Provider cost is display-only mock USD.
- Deleted users are not recoverable here.
- One organization and one optional team are the current assignment model.

## 11. To be reviewed

- Whether product access should ever be granted per user.
- Whether import should allow partial success.
- Whether XLSX is required.
- Email reuse after logical delete.
- What should happen to history and usage when a user changes organization.
- Whether inactive organization access should also change the user badge.
- Recovery for deleted accounts.
- The final meaning of last login and registration type.

## 12. Development team validation items

- API shape for users, membership, import jobs, and activity.
- Case-insensitive email uniqueness and concurrency.
- CSV encoding, size limits, and server-side validation.
- Audit event retention and actor identity.
- Time zone for joined date, last login, and usage dates.
- Authorization for status changes, organization moves, and import.
- How future Usage & Costs should reuse `UserUsageRecord` without copying it
  into another store.
