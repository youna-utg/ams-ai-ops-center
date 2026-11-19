# AMS Information Architecture Draft

## 1. Document status

- IA version: **v1.1**
- Status: team-review draft
- Updated: 2026-11-19
- Scope: application navigation and planned page structure
- Implementation stage: navigation, routes, tabs, and placeholder content only

This document is a planning aid. Menu names, workflows, policies, columns,
filters, and actions are not final service requirements. The existing Angular
19 shell, Dashboard, Component Showcase, shared components, and design tokens
remain the implementation baseline.

### Source labels

- **Existing AMS:** a capability already represented by the current prototype
  or confirmed from the previous AMS structure.
- **Proposed:** a candidate for a future implementation.
- **To be reviewed:** an unresolved policy or product decision.

## 2. Menu groups and routes

1. **Overview**
   - Dashboard — `/overview`
2. **Customer Management**
   - Organizations — `/organizations`
   - Users — `/users`
3. **Product Management**
   - Products — `/products`
   - Plans & Points — `/plans-points`
4. **AI Operations**
   - Providers & Models — `/providers-models`
   - Usage & Costs — `/usage-costs`
5. **Administration**
   - Admin & Permissions — `/admin-permissions`
   - Activity History — `/activity-history`
6. **System**
   - System Monitoring — `/system-monitoring`
   - Settings — `/settings`

The Sidebar contains 6 groups and 11 menus. Related capabilities are moved to
internal tabs; they are not removed.

## 3. Internal tabs

- Plans & Points: **Plans / Point Policies**
- Providers & Models: **Providers / Models**
- Usage & Costs: **API Usage / Cost Analytics / Rate Cards**
- Admin & Permissions: **Admin Accounts / Permissions / Presets**
- System Monitoring: **Health / System Logs / Incidents**
- Settings: **General / Notifications / Preferences**

Tabs use the `tab` query parameter so a tab selection can be bookmarked and
participates in browser history.

## 4. Menu plans

### 4.1 Dashboard

**Purpose:** Show company-wide product, user, AI operation, API usage, and cost
status.

**Existing AMS:** Keep the current KPI cards, usage and token trends, Provider
cost trend, cost breakdowns, Product Overview, Recent Activities, Provider
Usage, System Health, mock interactions, and Component Showcase unchanged.

**Proposed:** Later separate the Component Showcase into an internal route
without adding a Design System item to the current Sidebar.

**To be reviewed:** final operational Dashboard composition and permissions.

### 4.2 Organizations

**Purpose:** Manage customer organizations, teams, basic information, and
product access.

**Planned sections:** summary, search and filters, organization table,
organization detail.

**Summary:** Total Organizations, Active Organizations, Inactive Organizations.

**Table columns:** Organization, Organization Code, Status, Teams, Users,
Active Products, Contract End, Created At, Actions.

**Filters:** organization name/code, status, product.

**Actions:** add, edit, change status, manage teams, add/remove product access.

**Detail views:** Overview, Teams, Users, Products, Product Usage History,
Activity History.

**Related menus:** Users, Products, Activity History.

**Source:** Proposed. Organization and team policy is to be reviewed.

### 4.3 Users

**Purpose:** Manage general user accounts across products. Administrator
accounts remain separate.

**Planned sections:** summary, search and filters, user table, user detail.

**Table columns:** User, Email, Organization, Team, Status, Registration Type,
Joined At, Last Login, Actions.

**Filters:** name/email, organization, team, status, registration type.

**Actions:** add, edit, activate/deactivate, import CSV/Excel, inspect product
access.

**Detail views:** Basic Information, Organization/Team, Product Access, Usage
Summary, Account History.

**Related menus:** Organizations, Products, Admin & Permissions.

**Source:** Existing AMS user concept plus proposed unified customer-user view.
Import format and account lifecycle are to be reviewed.

### 4.4 Products

**Purpose:** Manage company products, operating status, and external AI
connections.

**Existing products:** ChangeUp, TimeUp, DeckUp, DocUp, MatchUp.

**Table columns:** Product, Product Code, Status, Active Users, Created At,
Actions.

**Actions:** add product, edit basic information, change status, add/remove
Provider and Model mappings.

**Registration fields:** Product Name, Product Code, Description, optional
Logo, Initial Status.

**Detail views:** Basic Information, Product Status, Provider & Model
Configuration, Usage Overview, Related Organizations/Users.

**Provider/Model configuration:** Providers (LLM), Providers (Non-LLM), Action
Code, Provider, Model, Connected Models, Add Mapping, Remove Mapping, Status.
An Action Code may map to multiple Providers and Models; do not force a 1:1
relationship.

**Related menus:** Providers & Models, Usage & Costs, Organizations, Users.

**Source:** Existing AMS product and Config concepts. Mapping selection logic is
to be reviewed with the development team.

### 4.5 Plans & Points

**Purpose:** Manage service plans and point grant/deduction/conversion rules
inside one menu while keeping the concepts separate.

#### Plans tab

- Columns: Plan Code, Plan Name, Plan Type, Points Grant, Duration, RPM,
  Status, Actions.
- Actions: add, edit, change status, inspect limits.
- Detail: Basic Information, Plan Type, Point Allowance, Usage Limits,
  Duration, Status.
- Reference types: Free, Trial, Point-based, Unlimited; previous AMS examples
  include Free, Trial, Pro, Pro+, Enterprise.

#### Point Policies tab

- Columns: Policy Name, Billing Basis, USD Unit, Points/USD Unit, Token Unit,
  Input Points, Output Points, Other Usage Units, Status, Actions.
- Actions: add, edit, activate/deactivate.
- Detail: Calculation Basis, Token Conversion, Request Base Points,
  Page/Image/Minute/Slide Points, Active Status.

**Related menus:** Products, Usage & Costs.

**Source:** Existing AMS plan and point-policy concepts. Service-specific
application scope is to be reviewed.

### 4.6 Providers & Models

**Purpose:** Manage external AI Providers and Models independently from their
product mappings.

#### Providers tab

- Summary: Total, Active, LLM, Non-LLM Providers.
- Columns: Provider, Provider Code, Type, Connector, API Connection, Status,
  Models, Actions.
- Detail: Basic Information, Connection Settings, API Endpoint, masked API
  Key, Linked Models, Related Products.

#### Models tab

- Columns: Provider, Model, Model Code, Model Type, Status, Connected Products,
  Actions.
- Detail: Basic Information, Provider, Model Type, Status, Related Products.

**Related menus:** Products for mappings; Usage & Costs for usage and rates.
Rate Cards are not duplicated here.

**Source:** Existing AMS provider/model concepts. Connector and credential
storage policy is to be reviewed; no real secrets are used in this prototype.

### 4.7 Usage & Costs

**Purpose:** Keep usage analysis, Provider cost analysis, and external API rate
management in one menu while preserving distinct data models.

#### API Usage tab

- KPI: Total API Requests, Success Rate, Error Rate, Input Tokens, Output
  Tokens, Average Response Time.
- Charts: API Requests Trend, Token Usage Trend, Error Rate Trend.
- Filters: date range, product, provider, model, status.
- Columns: Timestamp, Request ID, Product, Provider, Model, Input Tokens,
  Output Tokens, Response Time, Status, HTTP Code, Actions.
- Detail: Request Information, Token Usage, Response Time, Error Information.

#### Cost Analytics tab

- KPI: Total Provider Cost, Cost Change, Top Cost Product, Top Cost Provider.
- Charts: Provider Cost Trend, Cost by Product, Provider, and Model.
- Filters: date range, product, provider, model.
- Columns: Product, Provider, Model, Requests, Input Tokens, Output Tokens,
  Provider Cost.
- Draft scope: cost represents external AI Provider cost, displayed in USD.
  Customer billing, revenue, and margin are outside this draft tab.

#### Rate Cards tab

- Columns: Provider, Model, Billing Unit, Input Price, Output Price, Currency,
  Effective Date, Status, Actions.
- Billing unit candidates: Token, Character, Image, Audio Minute, Request,
  Page.
- Detail: Provider Information, Model Information, Pricing Unit, Input/Output
  Price, Effective Date, Pricing History.

**Related menus:** Products, Providers & Models, Plans & Points.

**Source:** Existing AMS usage, cost, and provider-pricing concepts. Cost scope,
currencies, effective-date behavior, and pricing history are to be reviewed.
Point Policies remain a separate function.

### 4.8 Admin & Permissions

**Purpose:** Manage internal AMS administrators and access permissions.

#### Admin Accounts tab

- Columns: Admin, Email, Department, Role/Preset, Status, Last Login, Actions.
- Detail: Basic Information, Status, Assigned Permissions, Login History.

#### Permissions tab

- Sections: Administrator Selection, Selected Admin Information, Permission
  Preset, Permission Checkbox Groups, Select All/Deselect All, Save Changes.
- Individual administrators may receive direct permission assignments.

#### Presets tab

- Examples: Super Admin, System Admin, Product Manager, Custom.
- Detail: Preset Name, Description, Assigned Permissions, Permission Count.
- Applying a preset updates permission checkboxes; editing individual
  permissions may switch the state to Custom.

**Related menus:** Activity History, Settings.

**Source:** Existing AMS administrator and permission concepts plus proposed
presets. Permission inventory and Sidebar visibility rules are to be reviewed.
No authentication server or permission API is implemented in this stage.

### 4.9 Activity History

**Purpose:** Track administrator work and configuration changes separately from
technical System Logs.

**Columns:** Timestamp, Admin, Activity, Resource, Resource ID, Previous Value,
New Value, Status.

**Filters:** date range, admin, activity type, resource, status.

**Detail:** Actor Information, Action, Target Resource, Previous Data, Updated
Data, Timestamp.

**Related menus:** Admin & Permissions and all editable resources.

**Source:** Existing audit/activity concept. Retention, sensitive-field masking,
and export policy are to be reviewed.

### 4.10 System Monitoring

**Purpose:** Review health, technical logs, and incident history.

#### Health tab

- Cards: Overall Health, Database, Redis, Queue, API Server, Uptime.
- Charts: System Availability, Error Trend, Response Time.

#### System Logs tab

- Columns: Timestamp, Service, Severity, Log Type, Message, Request ID.
- Filters: date range, service, severity, log type, keyword.
- Detail: Event Information, Service, Error Message, Request ID, Technical
  Details.

#### Incidents tab

- Columns: Incident ID, Service, Severity, Started At, Resolved At, Duration,
  Status, Actions.
- Detail: Incident Summary, Affected Services, Root Cause, Resolution,
  Timeline.

**Related menus:** Activity History, Usage & Costs.

**Source:** Existing System Health and System Logs concepts; Incidents is
proposed. No live monitoring integration is implemented in this stage.

### 4.11 Settings

**Purpose:** Manage common AMS preferences without duplicating administrator
permissions.

#### General tab

- Language, Timezone, Default Date Format.

#### Notifications tab

- Notification Preferences, Alert Settings.

#### Preferences tab

- Table Density, Pagination Size, Column Preferences.

**Related menus:** Admin & Permissions.

**Source:** Existing Settings destination plus proposed sections. The boundary
between personal and system-wide settings is to be reviewed.

## 5. Legacy route mapping

- `/plans` → `/plans-points`
- `/point-policies` → `/plans-points?tab=point-policies`
- `/api-usage` → `/usage-costs?tab=api-usage`
- `/cost-analytics` → `/usage-costs?tab=cost-analytics`
- `/rate-cards` → `/usage-costs?tab=rate-cards`
- `/admin-accounts` → `/admin-permissions?tab=admin-accounts`
- `/roles-permissions` → `/admin-permissions?tab=permissions`
- `/system-health` → `/system-monitoring?tab=health`
- `/system-logs` → `/system-monitoring?tab=system-logs`

## 6. To be reviewed

- Final menu labels, grouping, and ordering.
- Organization, team, contract, and account lifecycle policies.
- Product-to-Provider/Model mapping selection logic.
- Plan and Point Policy application scope.
- Provider credential storage and masking rules.
- Cost scope, currency, billing units, and pricing history behavior.
- Permission inventory, presets, and role-based Sidebar visibility.
- Activity and System Log retention, masking, and export.
- Incident workflow and live monitoring integration.
- Personal versus system-wide Settings.
- Whether and when Component Showcase moves to an internal `/design-system`
  route.
