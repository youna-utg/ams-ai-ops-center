# System Monitoring Draft

## 1. Document status

- Stage: AMS Redesign STEP J
- Status: team-review frontend prototype
- Updated: 2026-11-20
- Runtime: Angular 19, local Mock Data only

This screen reviews how operators would look at sample service health, sample
system logs, and sample incidents. It is not a live monitoring system. It does
not check servers, collect logs, send alerts, or calculate uptime.

The prototype clock is 2026-11-20 KST, the same clock used by Usage & Costs
and Activity History. Seed timestamps use a `+09:00` offset. New incident
events are also stored as KST offset strings, and lists sort by the actual
instant. That display choice is provisional.

## 2. System Monitoring IA

- Route: `/system-monitoring`
- Sidebar group: System, existing item only. No new menu
- IA v1.1 stays at 6 groups and 11 menus
- Tabs: Health (default), System Logs, Incidents
- No service, log, or incident detail route
- Settings remains a placeholder for a later step

Legacy redirects:

- `/system-health` opens Health
- `/system-logs` opens System Logs

Page title: `System Monitoring`

Description: `서비스 상태, 시스템 이벤트, 장애 처리 현황을 확인합니다.`

Notice: `샘플 모니터링 데이터입니다. 실제 시스템과 연결되어 있지 않습니다.`

Query `tab` is omitted for Health. `system-logs` and `incidents` are explicit.
Each tab keeps its own filters. Changing tabs does not clear the other tab's
search, range, sort, or page. Closing a dialog removes only the `incident`
parameter.

## 3. Health Tab

KPIs use the latest health sample for each sample service:

- Total Services
- Healthy Services
- Degraded Services
- Down Services

Unknown is not counted as Healthy. A service with no sample is Unknown.
The current sample set is 6 services: 2 healthy, 1 degraded, 1 down, 2 unknown.

Overall Health is a display rule for this prototype:

- One or more Down: Service Disruption
- No Down, one or more Degraded: Partial Service Degradation
- Every service Healthy: All Systems Operational
- Anything else: Status Unknown, with a short mixed-state note

These rules are not an operational policy.

The service list shows name, type, status, last checked, response time, and
the count of incidents whose status is not Resolved. Last Checked is the
sample timestamp. Response time is `—` when the sample has none. There is no
uptime percentage and no chart. The sample series is short, so recent samples
are shown as a table in the service dialog.

`새로고침` rereads the in-memory store. It does not change status or create logs.

## 4. System Logs Tab

KPIs use the filtered log set. Error, Warning, and Critical are separate
levels and are not added together.

Filters:

- Date range: Today, Last 7 Days (default), Last 30 Days, Custom Range
- Level: All, Debug, Info, Warning, Error, Critical
- Service, from the sample service catalog
- Search: log id, event, message, correlation id

The default window is 2026-11-14 through 2026-11-20 and contains 17 sample
logs: 3 Error, 5 Warning, 2 Critical. Older sample logs remain available in
Last 30 Days and Custom Range.

The table shows timestamp, level, service, event, message, correlation id,
and Actions. Message is one line. The full message is in the dialog.
Default sort is newest first. Sort is also available for level and service.
Page size is 10, 20, or 50. The default is 20.

Correlation ids that exist can be copied. Logs without one show `—`.

## 5. Incidents Tab

KPIs use the filtered incident set:

- Total Incidents
- Open Incidents: every status except Resolved
- Critical Incidents: severity Critical, including resolved rows in the filter
- Resolved Incidents

Search matches incident id, title, description, and affected service name.
Filters are status, severity, service, and date range. The default range is
Last 30 Days, which contains all 5 seed incidents: 4 open, 1 critical, 1
resolved. Default sort is created time, newest first. Status and severity
can be sorted. Page size matches the log table.

The table shows id, title, severity, status, affected service, assignee,
created, updated, and Actions. Actions are `상세` and `상태 변경`. There is
no delete.

Seed ids look like `INC-0001`. They are mock ids.

## 6. Service Detail

Clicking a service opens a wide dialog. It shows the service, its latest
status, last checked, response time, recent samples, up to five newest logs
for that service, and incidents that name that service.

`시스템 로그 보기` opens System Logs with that service filter and keeps the
other log filters. `장애 보기` opens Incidents with that service filter.
A log row inside the dialog replaces the service dialog. `서비스로 돌아가기`
returns to it. The close control returns to the list.

There is no control that edits health status. Resolving an incident does not
change the service sample.

## 7. Log Detail

The log dialog shows id, time, level, service, event, correlation id, and the
full message. Technical details are shown only when the sample has them:
error code, error category, context, and a sanitized stack trace. If none of
those fields exist, the dialog says `기술 상세가 없습니다.`

A log is related to an incident only when the sample sets `incidentId`.
Same service or same time is not enough. `장애 보기` opens that incident
dialog and closes the log dialog.

Displayed message, context, and stack text pass through a mask for values
that look like keys, bearer tokens, passwords, or `token=` assignments. The
seed data does not contain secrets. The mask is a prototype display guard,
not a security control.

## 8. Incident Detail

Incident detail is a wide dialog, not a page and not a drawer. The content is
split into sections so it can move to a page later if the team wants that.

- Overview: id, title, description, severity, status, assignee, created,
  updated, resolved
- Impacted Services: name, type, current health. A known service opens the
  service dialog and can return to the incident
- Incident Timeline, oldest first
- Related Logs: only logs whose `incidentId` matches. A row opens the log
  dialog. `장애로 돌아가기` returns to the incident

`INC-0003` is the seed incident with no related logs. `INC-0001` has related
logs. `log-0013` is a Sample Queue log that is intentionally not linked to
`INC-0001`.

Status changes and notes update the open dialog. Cancel does not write.
Closing the dialog returns to the incident list and keeps the list query.
The dialogs do not stack. One overlay is open at a time.

## 9. Incident Timeline

Timeline event types:

- Incident Created
- Status Changed
- Assignee Changed
- Severity Changed
- Note Added
- Incident Resolved
- Incident Updated

Each row shows time, type, actor, and description. Seed rows and new rows use
`Demo Operator`. That label means there is no signed-in user. It is not a
staff record.

Existing timeline rows cannot be edited or deleted. A new note updates the
incident `updatedAt` and does not write an Activity History row. Notes are
part of the incident workflow, not the admin change feed.

Resolved stores `resolvedAt`. Choosing another status clears `resolvedAt` and
appends a new timeline row. The older resolved row stays. Any status can be
selected. This prototype does not enforce a linear workflow or an approval
step.

## 10. Mock Data Architecture

One `MonitoringStore` holds services, health samples, logs, incidents,
timeline events, and incident activity rows. Health cards, log tables, and
incident tables read that store. Status text is not copied into each screen.

Sample services, all explicitly named Sample:

| Id | Name | Type | Latest status |
| --- | --- | --- | --- |
| svc-0001 | Sample AMS App | Application | Healthy, 42 ms |
| svc-0002 | Sample AMS API | API Service | Degraded, 840 ms |
| svc-0003 | Sample Database | Database | Healthy, 12 ms |
| svc-0004 | Sample Queue | Queue | Down, no response time |
| svc-0005 | Sample Storage | Storage | Unknown |
| svc-0006 | Sample Worker | Application | Unknown, no sample |

Service types are labels for the prototype. They are not a statement of the
real AMS infrastructure.

Assignees use Admin Account ids from the existing admin catalog. Unassigned
incidents show `미지정`. The screen does not invent a name when an id is
missing.

New ids continue from the current numeric suffix: the next incident is
`INC-0006`, the next timeline id is `timeline-0010`, and the next activity id
is `monitoring-activity-0009`.

## 11. Tab navigation

- Health to System Logs applies the selected service as the log service filter
- Health to Incidents applies the selected service as the incident service filter
- Log detail to an incident opens the incident dialog
- Incident related logs open the same log dialog
- Incident impacted service opens the service dialog
- Activity History links to `/system-monitoring?tab=incidents&incident=<id>`
  and opens that dialog

List search, filters, sort, and page stay in the query. Dialog scroll is
inside the dialog. The list underneath is not rebuilt as a second copy.

## 12. Activity History integration

Incident admin changes are appended to `MonitoringStore.activities`.
`ActivityFeed` reads that list once and exposes it as module
`System Monitoring`. The same row is not written again by the feed.

Recorded after a successful change:

- Incident created
- Incident updated, only for title, description, or affected service
- Status changed
- Severity changed
- Assignee changed

Not recorded:

- Opening the page, changing tabs, searching, or filtering
- Refresh
- Cancel and failed validation
- A save where no field changed
- Timeline notes
- Health samples and system logs

A status change therefore has one timeline row and one activity row. Those
are different records. The activity list does not also import the timeline.

The actor on new incident activity is `Demo Operator`.

## 13. Implemented mock interactions

- Health refresh rereads the store and shows a toast
- Log filters, search, sort, pagination, clear, and detail
- Copy a correlation id
- Add incident, with required title, description, service, and severity
- Initial status defaults to Open. Resolved on create stores `resolvedAt`
- Similar incidents are not blocked as duplicates
- Edit incident. Cancel and unchanged saves do not write
- Change status, including back to Open. Optional resolution note
- Add a timeline note
- KPI and tables follow the same store after a save
- Toasts for save, unchanged status, and note

Adding or resolving an incident does not change health samples and does not
send email or chat messages.

## 14. Provisional UX and policy assumptions

- Wide dialogs are the review choice for service, log, and incident detail
- Four incident statuses and four severities are a review set
- Open means every status except Resolved
- Health and incident status stay independent
- Sample service names and types are not production topology
- KST display uses the existing prototype clock
- Demo Operator is the actor because no one is signed in
- Assignee options are the Admin Accounts sample catalog, including inactive
  accounts marked `비활성`
- No uptime, SLA, chart, alert rule, or on-call schedule is shown
- Incident ids are mock ids

## 15. Team review

- Which services should actually be monitored?
- Which health indicators are required?
- How should a system incident differ from an API usage error?
- How many severity levels are useful?
- Are Open, Investigating, Monitoring, and Resolved enough?
- Who should be allowed to register and own an incident?
- Does incident detail need its own page once the content grows?
- Which roles need alerts, and through which channel?

## 16. Engineering confirmation

- How monitoring data would be collected
- Whether each service can expose a health check
- The real server and infrastructure layout
- Where logs are stored and how long they are kept
- Whether correlation ids exist
- How an incident should reference logs
- Whether live streaming is required
- Who can view monitoring data
- What should trigger an alert
- How SLA or uptime would be calculated, if at all
- How secrets and customer content are masked
- Whether resolving an incident should ever change service health
- The timestamp and time-zone standard

None of the items above is decided by this prototype.
