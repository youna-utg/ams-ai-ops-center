# Admin & Permissions Draft

## 1. Document status

- Stage: AMS Redesign STEP H
- Status: team-review frontend prototype
- Updated: 2026-11-20
- Runtime: Angular 19, local Mock Data only

This document describes the Admin & Permissions prototype used to discuss
administrator accounts, menu-level access, and reusable permission presets.
It does not define authentication, authorization, sessions, invitations, or
the real UPTEMPO operating policy.

Sample names, emails, presets, and last-login times are review values. They
are not production accounts and they are not customer Users.

## 2. Admin & Permissions IA

- One menu: `/admin-permissions`
- Sidebar group: Administration, before Activity History
- Tabs: `Admin Accounts` (default), `Permissions`, `Presets`
- Query: omit `tab` for Admin Accounts, `tab=permissions`, `tab=presets`
- Legacy redirects: `/admin-accounts` → Admin Accounts, `/roles-permissions`
  → Permissions
- No admin detail route and no preset detail route. Both use dialogs
- IA v1.1 stays at 6 groups and 11 menus. No new sidebar item
- Activity History remains a placeholder. This step only stores activity
  records for a later screen

Page title: `Admin & Permissions`

Description: `관리자 계정, 접근 권한, 권한 Preset을 관리합니다.`

The three tabs do not share one editor. Switching away from Permissions with
unsaved changes asks before discarding them. Other filters stay in the query.

## 3. Admin Accounts

Admin Accounts are AMS operators. They are not Organization users, they do
not belong to a customer Team, and they are not loaded from the Users store.

Summary, from the admin records only:

- Total Admins
- Active Admins
- Inactive Admins

There is no signed-in user, so the page does not show an online count.

Search matches name and email. Filters are Status, Permission Type
(`Preset` or `Custom`), and Assigned Preset. Combined filters, sort, and
pagination use the same list. Page size is fixed at 10.

Columns: Admin, Email, Permission Type, Assigned Preset, Status, Last Login,
Created At, Actions.

The Admin cell is the name only. It follows the current list tables and does
not add an avatar. Preset admins show the live preset name. Custom admins
show `Custom`. Status badges are `활성` and `비활성`. Last Login with no
sample time shows `—`. Those timestamps are sample data, displayed in KST,
and are not collected from a login system.

Actions: `상세`, `수정`, `권한 설정`, `활성화` / `비활성화`. There is no
delete action. `권한 설정` opens the Permissions tab with that admin selected.

Empty copy: `등록된 관리자가 없습니다.`

No-results copy: `조건에 맞는 관리자가 없습니다.`

## 4. Admin detail and forms

Detail is a dialog: Basic Information, Permission Assignment, Recent Activity.
Recent Activity lists mock events for that admin, plus preset-updated events
for the preset they currently use. The actor is `Demo Administrator`. If
there are no events, the copy is `기록된 변경이 없습니다.`

Add and edit use one dialog.

Fields: Full Name, Email, Permission Type, Permission Preset or a compact
matrix, Initial Status.

- Permission Type defaults to Preset
- A new admin defaults to Inactive
- Edit does not change status. Status uses the separate activate and
  deactivate confirmation
- Preset mode shows the selected preset's menu summary
- Custom mode shows the same Permission Matrix used on the Permissions tab
- Switching an existing preset admin to Custom starts from that preset's
  current permissions

Validation:

- Name and email are required
- Email must look like an email address
- Email is unique among Admin Accounts, compared without case
- Customer User emails are not checked. Whether the two account systems
  share an identity is undecided
- Preset mode requires a preset
- Custom mode stores one permission row per current menu. An all-clear
  matrix is structurally valid in this prototype

The form has no password, temporary password, invitation, or token. Save
adds or updates the in-memory admin and writes a mock activity. The toast
does not claim that a real account was created.

Deactivate confirmation:

`이 관리자는 프로토타입에서 비활성으로 표시됩니다. 실제 로그인 세션이나 메뉴 접근은 차단하지 않습니다.`

Activate has the matching prototype notice. Neither action signs anyone out
or hides a menu. The prototype does not protect the last active admin.

## 5. Permissions Matrix

The matrix follows IA v1.1. Menu labels and groups come from `NAV_GROUPS`,
so they stay aligned with the sidebar.

Groups and menus:

- Overview: Dashboard
- Customer Management: Organizations, Users
- Product Management: Products, Plans & Points
- AI Operations: Providers & Models, Usage & Costs
- Administration: Admin & Permissions, Activity History
- System: System Monitoring, Settings

Columns are View and Manage.

- View means the menu can be read
- Manage means records on that menu can be added, edited, or have their
  status changed
- Turning Manage on also turns View on
- Turning View off also turns Manage off
- Both can be off
- View can be on alone
- Dashboard is view-only in this prototype. Its Manage cell is `—`

Activity History, System Monitoring, and Settings still show Manage. Whether
those menus need a manage right is not decided. The checkbox is a temporary
prototype control, not a policy that those menus are editable.

Groups can be collapsed. The control is a table, not a new permission tree.
View and Manage are explained above the table.

## 6. Preset-based and custom permissions

Effective permissions are calculated, not stored a second time.

- Preset admin: the current permissions of `presetId`
- Custom admin: `customPermissions` on that admin

Permissions tab shows the admin name, email, status, type, source, and
accessible-menu summary.

Preset mode is a read-only matrix. Another preset can be chosen and saved.
That changes only the assignment. `맞춤 권한으로 전환` copies the current
preset into an editable draft. Save then sets that admin to Custom and
clears the preset assignment. The preset record is not edited, and other
admins are not edited. Cancel restores the last saved assignment.

Custom mode edits the checkboxes directly. Save writes that admin only.
Cancel restores the last saved custom permissions. A dirty switch of admin
or tab asks before discarding.

This screen does not hide routes, disable buttons, or identify the person
using the browser.

## 7. Presets

Primary action: `Preset 추가`

Summary:

- Total Presets
- Assigned Admins, counting admins whose type is Preset and whose preset id
  is set. Custom admins are not counted

Search matches name and code.

Columns: Preset, Preset Code, Description, Accessible Menus (`8 / 11 Menus`),
Assigned Admins, Updated At, Actions.

Actions: `상세`, `수정`, `복제`. There is no delete.

Sample presets, all with real permission rows:

- Full Access, `FULL-ACCESS`: view on every menu, manage on every menu
  except Dashboard
- Operations Manager, `OPS-MANAGER`: manage for Organizations, Users,
  Products, Plans & Points, Providers & Models, and Usage & Costs; view for
  Dashboard, Admin & Permissions, Activity History, and System Monitoring;
  Settings is off
- Read Only, `READ-ONLY`: view on every menu, manage on none

These names are demo labels. They are not confirmed operating roles. Nothing
marks them as undeletable beyond the general lack of a delete action.

Add and edit use the shared matrix. Code is required, unique without case,
and limited to uppercase letters, numbers, and hyphens. After create, code
is read-only. The edit form shows how many admins currently use the preset.
If that count is greater than zero, save asks for confirmation and then
updates the preset. Admins who point at that preset see the new effective
permissions. Custom admins do not. This propagation is a prototype
assumption.

Duplicate asks for a new name and code, copies the matrix and description,
and leaves the source preset unchanged.

## 8. Shared Mock Data relationships

`AdminStore` is a separate root store. It holds `AdminAccount`,
`PermissionPreset`, and `AdminActivity`. It does not read or write Users.

Seeded accounts use `@ams.example` addresses:

- Mina Park, Jun Seo, Hana Choi, Owen Blake, Sora Kim, Noah Lee
- Owen Blake is inactive and Custom
- Hana Choi and Noah Lee have no sample last login

Activity actions recorded by the store:

- Admin Created, Admin Updated, Admin Activated, Admin Deactivated
- Preset Assigned, Custom Permissions Updated
- Preset Created, Preset Updated, Preset Duplicated

Each record has a timestamp, action, target admin and/or preset, previous
value, new value, and actor `Demo Administrator`. This is not an employee
audit log. The Activity History page is not built in this step. Product and
Organization activity records stay in their own stores.

## 9. Implemented interactions

- Tab switching, with a discard prompt on dirty permission edits
- Admin search, filters, sort, pagination, add, edit, detail, activate,
  deactivate, and jump to Permissions
- Email format and duplicate checks inside Admin Accounts
- Permission matrix view/manage dependency
- Preset read-only view, preset reassignment, customize, save, and cancel
- Preset search, add, detail, edit, assigned-count confirmation, and duplicate
- Empty and no-results states, toasts, and dialogs
- Tables and the matrix scroll inside their cards at 1024px

## 10. Provisional UX assumptions

- One sidebar item and three tabs
- Menu-level View / Manage is enough for this review
- Dashboard is view-only
- New admins start inactive
- The list has no avatar
- Last Login `—` means the sample has no time
- Custom with every menu off is allowed
- Preset edits immediately change every admin still assigned to that preset
- Preset code cannot be edited after create
- Overlapping or conflicting presets are not resolved; an admin has one
  source, either one preset or custom
- Status does not block the prototype UI
- There is no super-admin flag and no last-admin guard
- KST is the display timezone for these sample timestamps

## 11. Team review

These items are not decided:

- Whether an Admin Account and a customer User are the same identity
- How an administrator would actually sign in or be invited
- Whether menu rights are enough, or feature rights are needed
- Whether View and Manage are the right two levels
- Super Admin and last-administrator protection
- What happens to an existing session when access changes
- Whether a preset edit should update current assignees, freeze a copy, or
  require each admin to accept it
- Backend enforcement
- How long permission-change history is kept

Not built, and not proposed as the current matrix:

- Create, Edit, Delete, Export, and Approve as separate rights
- Per-endpoint access
- Per-product management rights
- Per-organization data scope
- Per-button permissions

## 12. Engineering checks

Left for a later build:

- Login, passwords, invitation email, MFA, and sessions
- Route guards and button enforcement
- API authorization
- A real role engine
- Impersonation
- An audit-log service
- Permanent admin or preset deletion
- The Activity History screen

Changing a checkbox in this prototype does not change what the current
browser can open.
