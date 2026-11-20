# Settings Draft

Provisional frontend prototype notes for the Settings menu. These choices are for review. They are not an operating policy.

## 1. Document status

Settings is a mock screen. It does not write environment variables, connect a backend, send email, or connect Slack. Refreshing the browser restores the sample values because the store is in memory.

The save interaction is the provisional A choice: each tab has an explicit Save Changes action. Switches do not save by themselves.

## 2. Settings IA

The existing sidebar item remains `Settings` at `/settings`. The three tabs are not separate sidebar items.

| Tab | Query | Role |
| --- | --- | --- |
| General | omit `tab` | Shared workspace defaults |
| Notifications | `?tab=notifications` | Shared notification rules |
| Preferences | `?tab=preferences` | Demo Administrator display preferences |

There is no settings detail route. Browser back and forward keep the tab query. The placeholder copy that mentioned language is not implemented. This prototype has no translation system.

## 3. General tab

Sections:

- Workspace Information
- Date & Time Settings
- Environment Information

Workspace display name is required. The sample value is `AMS`. Description is optional. Timezone options are Asia/Seoul, UTC, America/Los_Angeles, and Europe/London. The sample default is Asia/Seoul. Date formats are `YYYY-MM-DD`, `MM/DD/YYYY`, and `DD/MM/YYYY`. The sample default is `YYYY-MM-DD`.

Environment Information is read-only:

- Environment: Frontend Prototype
- Data Source: Mock Data
- Backend Connection: Not Connected
- Notification Delivery: Not Configured

There is no field for a backend URL, database, API key, or restart action.

## 4. Notifications tab

Sections:

- Notification Rules
- Delivery Channels
- Notification Preview

Rules are examples for review:

| Rule | Sample default | Extra setting |
| --- | --- | --- |
| Product Access Expiry | On | 7일 전 and 종료일 당일 |
| Incident Notifications | On | 장애 등록, 상태 변경, Critical 장애 |
| Product Status Changes | On | none |
| Provider & Model Status Changes | Off | none |
| Admin & Permission Changes | On | none |

Turning a rule off keeps its extra settings in the draft. Turning it back on restores those settings. An enabled expiry rule needs at least one timing. An enabled incident rule needs at least one event.

Delivery channels are fixed facts, not saved settings:

- In-App: 데모 전용
- Email: 설정되지 않음
- Slack: 설정되지 않음

The screen does not ask for an email address, webhook, or bot token. There is no Send Test button. Notification Preview only shows sample copy.

Enabling Product Access Expiry does not expire or block product access. Incident rules do not detect or send incidents.

## 5. Preferences tab

The subject is `Demo Administrator`. That label is a mock actor. It is not a signed-in account and it is not an email address.

Sections:

- Display Settings
- Table Settings
- Navigation Settings

Preferred timezone and date format default to `시스템 기본값`. A personal value wins over General. `시스템 기본값` reads the saved General value.

Default rows per page are 10, 20, or 50. The sample default is 20. Default landing pages are Dashboard, Organizations, Products, and Usage & Costs. The sample default is Dashboard.

Table density, theme, accent color, and font settings are omitted. The current design system does not have a user-selectable density or theme switch, and this step does not add one.

## 6. Fields

General stores `workspaceDisplayName`, `workspaceDescription`, `defaultTimezone`, `defaultDateFormat`, and `updatedAt`.

Notifications store the five rules and `updatedAt`. Each rule has `id`, `enabled`, `timings`, and `events`.

Preferences store `adminId` (`demo-administrator`), `preferredTimezone`, `preferredDateFormat`, `defaultPageSize`, `defaultLandingPage`, and `updatedAt`.

## 7. Save, Cancel, and Reset

Save Changes stays disabled until the open tab differs from the last saved value. Save validates that tab only and updates that tab's state. The other tabs stay as they were. A successful save clears the unsaved state and shows a toast. A save with no difference writes nothing.

Cancel copies the last saved value back into the open tab.

Reset to Default asks for confirmation, then loads that tab's sample defaults into the draft. It does not write the store. Cancel after reset returns to the last saved value. Saving after reset is what stores the defaults.

## 8. Unsaved changes

The open tab shows `미저장` and the sentence `저장하지 않은 변경이 있습니다.`

Moving to another tab, opening the selected landing page, using the sidebar, or using browser back while the form is dirty opens a confirmation:

- 계속 편집 keeps the draft and stays
- 변경 버리고 이동 restores the saved value and continues

The route uses one `canDeactivate` callback on `/settings`. It is not a new application-wide guard system. A browser refresh uses the native beforeunload prompt. Refresh still restores the sample store afterward.

## 9. Mock data

`SettingsStore` is a root in-memory store. General and Notifications are shared. Preferences belong to the fixed mock id `demo-administrator`.

New activity ids start at `settings-activity-0001`. Timestamps use a KST offset (`+09:00`), matching System Monitoring.

The preview clock is the fixed sample `2026-11-20 10:00` in Asia/Seoul, converted into the selected timezone and date format. It is not the live clock and it is not `USAGE_CLOCK` rewritten across other menus.

## 10. Relationship to other menus

Product Access Expiry refers to the access-period idea from Organizations. This screen stores the rule only.

Product, provider, model, admin, and incident rules point at those menus as event types. Their existing status flows are unchanged.

Activity History reads settings activities from this store. It does not keep a second copy.

## 11. What the saved value changes on screen

- Workspace display name, after save, replaces the root label in the top breadcrumb. The sidebar brand and logos stay `AI Ops Center`.
- The Settings preview shows the draft date, timezone, workspace text, notification copy, and a five-row table sample.

## 12. What stays inside Settings

- General timezone and date format do not reformat Organizations, Users, Products, Plans, Providers, Usage, Admin, Activity History, or System Monitoring.
- Preferred timezone and date format affect the Preferences preview. `시스템 기본값` uses the saved General value there.
- Default page size changes the Settings table preview only. Existing lists keep their own page size.
- Default landing page is stored. Login does not redirect. `선택한 화면 열기` is a manual navigation.
- Notification rules and channel status do not send anything.

## 13. Activity History

A successful save with at least one changed field writes one event:

- General Settings Updated
- Notification Settings Updated
- Personal Preferences Updated

Module label: Settings. Actor: Demo Administrator. The link opens the matching Settings tab. Cancel, failed validation, an unsaved reset, and a save with no difference write nothing.

## 14. Provisional assumptions

- One explicit save per tab is the review default.
- Demo Administrator stands in for the current admin.
- Five notification rules and three channels are enough to review the layout.
- In-app delivery means the on-screen preview only.
- Empty description is allowed. Empty workspace name is not.
- Reset restores the sample defaults, not an earlier custom save, until the user saves again.

## 15. Team review

- Which general settings does AMS actually need?
- Is the split between shared settings and personal preferences right?
- Which operational events need a notification?
- When should a product-access reminder fire?
- Which channels are required?
- Who receives each notification?
- Do admins need a personal timezone and date format?
- Is explicit save clearer than saving each switch immediately?
- Who may edit shared settings?

## 16. Engineering confirmation

- Where real settings are stored
- How environment-specific values are separated
- How preferences attach to a real account
- How timezone and date format would apply across screens
- Whether notification triggers can be implemented
- What delivery infrastructure exists
- The scope of email and Slack
- How a saved setting reaches the server
- Who can open Settings
- How history and rollback should work
- How settings are cached and synced
- Which validations and side effects a real change has
