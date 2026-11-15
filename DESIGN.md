# AMS / AI Ops Center --- Design System

**Version:** 0.1\
**Status:** Initial design baseline\
**Implementation target:** Angular 19 · Light theme · Desktop-first
responsive web\
**Purpose:** High-fidelity design-system and UI-publishing prototype;
not a production AMS implementation.

## 1. Product context

AMS is the company's internal central operations console for managing
its product ecosystem, users, projects, AI providers/models,
provider-side usage costs, and system operations.

### Current product portfolio

  -----------------------------------------------------------------------
  Product                 Domain                  Description
  ----------------------- ----------------------- -----------------------
  ChangeUp                Webtoon                 Webtoon translation
                                                  workflow

  TimeUp                  Video                   Video translation
                                                  workflow

  DeckUp                  Presentation            PowerPoint translation
                                                  workflow

  DocUp                   Document                Word document
                                                  translation workflow

  MatchUp                 Translation QA          Translation review and
                                                  quality-check workflow
  -----------------------------------------------------------------------

The portfolio may expand. Do not hardcode layouts for exactly five
products.

### Goals

-   Make operational status and cost information easy to scan.
-   Support dense enterprise tables without sacrificing readability.
-   Establish consistent reusable components and design tokens.
-   Allow future products, providers, models, administrators, and
    modules to scale.
-   Keep the implementation maintainable and suitable for later product
    development.

### Scope boundaries

-   Use mock data only; no production backend or API integration.
-   Populate only Dashboard in the initial prototype; other menu
    destinations remain lightweight placeholders.
-   Do not invent detailed workflows or final business rules for
    unconfirmed modules.
-   Current Usage / Cost means **the amount the company pays external
    providers**.
-   Customer charges, selling prices, revenue, and margins are separate
    future concepts and are out of scope.
-   Detailed permission names and authorization policies are provisional
    until feature planning is complete.

## 2. Visual direction

### Modern Minimal Enterprise

Create a calm, precise, contemporary B2B operations console.

-   Light theme with white and cool-neutral surfaces.
-   Blue accent `#2F9AFF`.
-   Thin, subtle borders; minimal shadows.
-   Clear typography and compact but comfortable information density.
-   Strong alignment and consistent spacing.
-   Restrained semantic colors.
-   Charts optimized for interpretation, not decoration.

Avoid large decorative gradients, glassmorphism, excessive blur, heavy
shadows, overly rounded controls, too many accent colors, oversized
headings, cramped tables, and ornamental charts.

### Component reference: Astryx

Use the Astryx component library as a primary reference:
https://astryx.atmeta.com/components

Review the component catalog and reuse/adapt suitable patterns wherever
possible. Astryx documents components including buttons, menus, cards,
inputs, forms, navigation, dialogs, overlays, status, and tables.
However, Astryx is built around React and StyleX; this project targets
Angular 19. **Do not assume its React components can be directly
installed into Angular.** Treat Astryx primarily as a component/design
reference unless a verified Angular-compatible integration path exists.
Do not compromise the Angular architecture to force direct adoption.

For AMS-specific needs that are absent or unsuitable---advanced data
tables, permission matrices, provider pricing, token/cost breakdowns,
monitoring panels---build custom Angular components using the same
visual language and tokens.

Reference source: https://astryx.atmeta.com/components

## 3. Color system

Use CSS custom properties as the single source of truth. Avoid repeated
hardcoded color values in component styles.

### Brand palette

  Token                   Value       Usage
  ----------------------- ----------- -----------------------------
  `--color-primary-50`    `#F0F8FF`   Very light blue surface
  `--color-primary-100`   `#E0F1FF`   Selected / hover background
  `--color-primary-200`   `#B9DFFF`   Soft border / tint
  `--color-primary-300`   `#80C4FF`   Subtle emphasis
  `--color-primary-400`   `#4DADFF`   Supporting accent
  `--color-primary-500`   `#2F9AFF`   Main brand accent
  `--color-primary-600`   `#1684EB`   Hover / stronger action
  `--color-primary-700`   `#086BC7`   Active / stronger text
  `--color-primary-800`   `#07569E`   Deep accent
  `--color-primary-900`   `#0A477D`   Deepest accent

Use `#2F9AFF` for primary actions, active navigation, selected controls,
links, focus accents, and the main chart series. Use pale tints for
large selected surfaces. For small text on white, use a darker blue
token when contrast requires it.

### Neutral palette

  Token                   Value
  ----------------------- -----------
  `--color-neutral-0`     `#FFFFFF`
  `--color-neutral-25`    `#FCFDFE`
  `--color-neutral-50`    `#F8FAFC`
  `--color-neutral-100`   `#F1F5F9`
  `--color-neutral-200`   `#E2E8F0`
  `--color-neutral-300`   `#CBD5E1`
  `--color-neutral-400`   `#94A3B8`
  `--color-neutral-500`   `#64748B`
  `--color-neutral-600`   `#475569`
  `--color-neutral-700`   `#334155`
  `--color-neutral-800`   `#1E293B`
  `--color-neutral-900`   `#0F172A`

### Semantic palette

  State     Main        Background   Text
  --------- ----------- ------------ -----------
  Success   `#16A36A`   `#EAF8F1`    `#117A50`
  Warning   `#D99016`   `#FFF6E5`    `#99620A`
  Danger    `#DC4C4C`   `#FFF0F0`    `#B83232`
  Info      `#2F9AFF`   `#F0F8FF`    `#176FC0`

Never communicate status through color alone. Pair semantic color with a
text label, icon, or other cue.

### Semantic aliases

Components must consume semantic aliases rather than primitive palette
values. This keeps visual intent stable if the palette changes.

-   **Primary action:** `--color-primary`, `--color-primary-hover`,
    `--color-primary-active`. Use for the highest-priority action,
    selected navigation, focus, and the main data series.
-   **Secondary action:** `--color-secondary`,
    `--color-secondary-hover`, `--color-secondary-active`. Use for
    neutral emphasized actions; do not compete with Primary.
-   **Surfaces:** `--color-background` is the application canvas,
    `--color-surface` is the standard white content surface,
    `--color-surface-subtle` separates low-emphasis regions, and
    `--color-surface-raised` / `--color-surface-overlay` support elevated
    content.
-   **Borders:** `--color-border` is the default boundary,
    `--color-border-strong` is reserved for emphasis, and
    `--color-divider` separates adjacent content.
-   **Text:** `--color-text-primary` for titles and core values,
    `--color-text-secondary` for descriptions, `--color-text-muted` for
    metadata, and `--color-text-disabled` for unavailable content.
-   **Status:** each of Success, Warning, Danger, and Info has main,
    background, text, and border tokens. Status still requires a label or
    icon.

Current canonical values:

-   `--color-primary: #2F9AFF`
-   `--color-primary-hover: #1684EB`
-   `--color-primary-active: #086BC7`
-   `--color-secondary: #334155`
-   `--color-background: #F8FAFC`
-   `--color-surface: #FFFFFF`
-   `--color-surface-subtle: #F8FAFC`
-   `--color-border: #E2E8F0`
-   `--color-text-primary: #0F172A`
-   `--color-text-secondary: #475569`
-   `--color-text-muted: #64748B`

Legacy aliases such as `--color-bg-app`, `--color-bg-surface`, and
`--color-border-default` remain temporarily mapped to canonical tokens so
existing components can migrate without visual regressions.

## 4. Typography

Preferred font stack:
`Pretendard, "Noto Sans KR", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Provide fallbacks; do not assume a remote font is available.

  Style          Size     Weight   Line height Usage
  ------------ ------ ---------- ------------- --------------------------
  Display        32px        700          1.25 Rare high-level emphasis
  H1             24px        700          1.35 Page title
  H2             20px        700           1.4 Section title
  H3             16px        600          1.45 Card / subsection title
  H4             14px        600          1.45 Minor heading
  Body large     15px        400           1.6 Intro copy
  Body           14px        400          1.55 Main UI text
  Body small     13px        400           1.5 Supporting text
  Label          13px   500--600           1.4 Form / data label
  Caption        12px        400          1.45 Metadata
  Numeric        14px   500--600           1.4 Metrics / table values

Use tabular numerals for costs, tokens, percentages, counts, and dates.
Keep units and precision consistent within a table or chart.

Implementation uses size, weight, line-height, and letter-spacing CSS
variables plus reusable `.text-*` classes. Numeric / Data uses
`--font-family-data`, `font-variant-numeric: tabular-nums lining-nums
slashed-zero`, and the `.text-numeric` / `.text-data` classes. This prevents
column jitter and improves comparison of costs, token counts, percentages,
dates, and durations.

## 5. Spacing, radius, borders, elevation

### Spacing

Use a strict 4px base scale. `--space-0` through `--space-16` map to
`0px` through `64px`; the suffix is the 4px multiplier. Components may use
intermediate values such as `--space-7: 28px` without introducing one-off
spacing.

Guidance: - Icon-to-label gap: 8px. - Input horizontal padding: 12px. -
Standard card padding: 20--24px. - Section gap: 24--32px. - Desktop page
padding: 28--32px. - Compact table cells: approximately 12px horizontal
and 10px vertical.

### Radius

  Token                  Value Usage
  -------------------- ------- -------------------------
  `--radius-small`         6px Inputs / buttons
  `--radius-medium`        8px Cards / menus
  `--radius-large`        12px Large panels / dialogs
  `--radius-full`        999px Pills / avatars

Most cards should use 8px and controls 6px. Avoid making every control
pill-shaped. Compatibility aliases `--radius-sm`, `--radius-md`, and
`--radius-lg` map to the semantic tokens; `--radius-xs: 4px` and
`--radius-xl: 16px` remain available only for compact or exceptional cases.

### Borders and shadows

-   Default border: 1px solid `--color-border-default`.
-   Use subtle borders to define cards and table boundaries.
-   Cards generally use white surfaces and borders rather than strong
    shadows.
-   Reserve elevation for menus, popovers, and dialogs.
-   Avoid unnecessary nested card borders.

Elevation tokens:

-   `--shadow-subtle: 0 1px 2px rgba(15, 23, 42, 0.04)` for small controls.
-   `--shadow-card: 0 2px 8px rgba(15, 23, 42, 0.06)` for cards only when a
    border is insufficient.
-   `--shadow-dropdown: 0 8px 24px rgba(15, 23, 42, 0.10)` for dropdowns,
    menus, and popovers.
-   `--shadow-modal: 0 16px 40px rgba(15, 23, 42, 0.14)` for modals and
    mobile navigation drawers.

Legacy `--shadow-xs` through `--shadow-lg` aliases map to these semantic
tokens.

### Shared borders and interaction states

-   Border: `--border-default` and `--border-strong`; components should not
    rebuild border shorthand values.
-   Divider: `--divider` or `--color-divider`; use one-pixel separators and
    avoid excessive vertical rules.
-   Focus: `--focus-outline` for keyboard focus and `--focus-ring` for form
    controls. Focus must remain visible and must not rely on browser defaults.
-   Hover: neutral `--color-hover` for low-emphasis controls; Primary actions
    use `--color-primary-hover`.
-   Active / selected: `--color-active` and `--color-selected`, paired with
    text, weight, or an indicator.
-   Disabled: `--color-disabled-*` and `--disabled-opacity`; preserve
    readability and use `not-allowed` cursor where relevant.
-   Loading: `--color-loading-base` and `--color-loading-highlight` drive the
    shared `.skeleton`; `.spinner` uses Primary. Loading motion is disabled
    when `prefers-reduced-motion` is enabled.
-   Motion: use `--duration-fast`, `--duration-normal`, `--duration-slow`, and
    `--ease-standard`; avoid decorative or prolonged animation.

## 6. Application shell

### Desktop-first layout

-   Persistent left sidebar, top header, main content.
-   Expanded sidebar: approximately 248px.
-   Collapsed sidebar: approximately 72px.
-   Header: approximately 64px high.
-   Main content padding: 28--32px.
-   App background: `--color-bg-app`.
-   Content surfaces: white.

### Sidebar

-   White surface and subtle right border.
-   Service identity at top.
-   Group labels in muted small text.
-   Consistent icon size, row height, and spacing.
-   Active item: pale blue background, blue text/icon, clear active
    indicator.
-   Subtle neutral hover.
-   Collapsed state supports tooltips.
-   Account/profile area near bottom.
-   Must support permission-filtered navigation in the future.

### Header

-   Current page title or breadcrumb.
-   Optional global search.
-   Notifications.
-   User profile menu.

Keep page-level filters and actions in the page header rather than
overcrowding the global header.

### Standard page structure

1.  Breadcrumb when useful.
2.  Page title and concise description.
3.  Page-level actions and filters.
4.  Primary content.
5.  Secondary content.

## 7. Provisional information architecture

This is a planning hypothesis, not a final approved IA. Keep menu labels
and groups configurable.

### Overview

-   Dashboard

### Product Management

-   Products
-   Product Users
-   Projects

### AI Operations

-   Providers & Models
-   Provider Pricing
-   Usage & Cost
-   Logs

### Administration

-   Plans
-   Point Policies
-   Admin Accounts
-   Roles & Permissions

### System

-   System Health
-   Settings

Only Dashboard is populated in the initial prototype. Other destinations
should show a page title, short description, and neutral placeholder; do
not invent detailed workflows.

### Product identity

The five known products are ChangeUp, TimeUp, DeckUp, DocUp, and MatchUp
as defined in Section 1. Use a consistent identity pattern: product
name, domain descriptor, status, and optional mark. Do not invent
separate product brand colors; use the shared blue and neutral palette.

## 8. Dashboard

Use realistic but clearly fictional mock data. Add a visible sample-data
cue where appropriate.

### Page header

-   Title: Dashboard
-   Description: Monitor products, platform activity, and AI operations.
-   Date range selector
-   Filter action
-   Optional dashboard customization action

### KPI cards

Initial metrics: 1. Total Products 2. Active Users 3. Total API Requests
4. Provider Cost 5. Total Tokens 6. Error Rate

Each card may include a label, main value, previous-period comparison,
supporting description, and optional sparkline.

### Usage analytics

-   API Requests Trend --- line chart.
-   Token Usage Trend --- line or area chart.
-   Provider Cost Trend --- line chart.

Include readable axes, useful tooltips, legends where needed, and
consistent date ranges. Avoid visual clutter.

### Cost analytics

-   Cost by Product --- bar chart.
-   Cost by Provider --- donut or bar chart.
-   Cost by Model --- horizontal bar chart or ranked table.

**Cost definition:** these values represent the company's payments to
external AI/API providers. Do not show customer selling price, customer
charges, revenue, profit, or margin.

When showing multiple breakdowns, make clear that they are alternative
groupings of the same spend and must not be added together.

### Product overview table

Suggested columns: - Product - Status - Active Users - API Requests -
Token Usage - Provider Cost

Must support the five known products and future additions.

### Provider usage table

Suggested columns: - Provider - Model - Requests - Input Tokens - Output
Tokens - Total Cost

### Recent activities

Suggested columns: - Activity - Product - User - Status - Date / Time

### System health

Illustrative status indicators: - Overall Status - API - Database -
Redis - Queue

These are mock monitoring components only; do not imply live
infrastructure integration.

### Dashboard hierarchy

1.  Page header and filters.
2.  KPI cards.
3.  Usage and cost analytics.
4.  Product and provider data.
5.  Recent activities and system health.
6.  Component Showcase.

Use a deliberate responsive grid rather than stacking every card
identically.

## 9. Component system

Build reusable Angular components with shared tokens. Use Astryx as a
reference for suitable patterns; verify compatibility before adopting
anything directly. Custom AMS components must visually match the same
system.

### Foundations

-   Typography styles
-   Icon wrapper and sizing
-   Divider
-   Surface / panel
-   Tooltip
-   Avatar
-   Skeleton
-   Spinner

### Buttons

Variants: Primary, Secondary, Outline, Ghost, Danger, Icon-only.\
Sizes: Small, Medium, Large.\
States: Default, Hover, Focus-visible, Active, Disabled, Loading.

Icon-only buttons need accessible labels and tooltips where useful.

### Form controls

-   Text input
-   Search input
-   Password input
-   Textarea
-   Select
-   Multi-select
-   Checkbox
-   Radio
-   Switch
-   Date picker
-   Date range picker

Include labels, helper text, errors, required indication, disabled and
focus states.

### Badges and status

Success, Warning, Danger, Info, Neutral, Active, Inactive, Pending,
Processing. Keep status understandable without color.

### Cards

Basic, KPI, Statistic, Information, Chart, Product, Provider.

### Enterprise tables

Tables are core AMS components. Build custom patterns if Astryx does not
meet the required needs.

Support: - Standard and dense table. - Sortable columns. - Row
selection. - Search and filters. - Pagination and result count. - Status
cells and row actions. - Numeric alignment. - Empty, loading, and error
states. - Responsive horizontal overflow.

Rules: - Distinct but restrained headers. - Left-align names and
descriptions. - Right-align comparable numeric values. - Use tabular
numerals for costs, counts, percentages, and tokens. - Consistent row
heights. - Subtle hover. - Avoid excessive vertical borders. - Do not
hide important values without an inspection method.

### Charts

Line, area, bar, stacked bar, donut, sparkline, progress bar.

Chart.js 4.x is the adopted rendering library, wrapped by a reusable Angular
`ChartComponent`. Dashboard pages provide typed data and options; the wrapper
resolves design-token CSS variables before drawing to canvas. Raw mock data
stays under `src/app/data/mocks` and is not embedded in the chart component.

Rules: - Primary blue for the main series. - Supporting series must be
distinguishable but restrained. - Readable axes and labels. - Tooltips
for exact values. - Explicit units and time ranges. - Never rely on
color alone. - No 3D charts or unnecessary animation.

### Navigation

Sidebar, breadcrumb, tabs, dropdown menu, pagination, accordion, stepper
where appropriate.

### Feedback and overlays

Alert, toast, tooltip, modal, confirmation dialog, popover, dropdown,
loading, skeleton, empty state.

Dialogs need a clear title, description, actions, and dismissal
behavior.

## 10. AMS-specific components

### Token and cost

-   Total token display.
-   Input / output token breakdown.
-   Token usage trend.
-   Provider cost display.
-   Cost by product / provider / model.
-   Budget progress visual pattern (do not imply budget rules are
    finalized).
-   Cost comparison.

Always show explicit units and currency. Use tabular numerals.

### Provider and model

-   Provider identity row/card.
-   Model name and metadata.
-   Provider connection status.
-   Model availability status.
-   Masked API key field.
-   Provider usage summary.
-   Pricing table.

Never expose real secrets; use fictitious masked values.

### Provider pricing table

Design a reusable table for later binding to provider/model pricing
data.

Suggested columns: - Provider - Model - Billing Unit - Input Price -
Output Price - Currency - Effective Date - Status - Actions

Requirements: - Support token rates such as per 1M input/output
tokens. - Allow other billing units such as image, audio, character, or
request where applicable. - Always show the billing unit beside the
price. - Support different input and output rates. - Include effective
date and status. - Mark sample prices as fictional. - Do not invent real
provider prices. - Design for future binding to usage-cost calculations.

### Permission management

Detailed permissions are not finalized. Build only the reusable
interaction pattern with provisional labels.

Required patterns: - Admin account list. - Selected account summary. -
Permission preset selector. - Permission checkbox groups. - Select all /
clear all. - Custom permission state. - Save / cancel actions. -
Optional unsaved-changes indicator.

Example presets: - Super Admin - System Admin - Product Manager - Custom

Selecting a preset updates the checkbox selection in the prototype.
Editing a permission after selecting a preset changes the displayed
preset to Custom.

The future system must distinguish: 1. Menu visibility permission. 2.
Action permission (create, edit, delete, approve, and other operations).

Hiding a menu is not sufficient security; production authorization must
also be enforced server-side. This prototype demonstrates UI only. Do
not treat example permission names or presets as final policy.

### System monitoring

-   Overall system status.
-   Service status.
-   API health.
-   Database status.
-   Queue status.
-   Error rate.
-   Uptime.
-   Incident / alert row.

Use sample status only.

### Activity and audit

-   Activity type.
-   Actor / admin.
-   Product.
-   Action.
-   Timestamp.
-   Status.
-   Severity.

Sensitive actions and permission changes should eventually have audit
history. The prototype may show an illustrative audit table only.

## 11. Permission-aware navigation

Structure sidebar configuration so it can later be filtered by the
signed-in administrator's permissions.

For the prototype: - Use mock accounts and mock permission sets if
needed. - Demonstrate different visible menu items for different
permission sets. - Keep navigation configuration separate from the
visual component. - Do not duplicate visibility rules across
components. - Keep action-level authorization separate from menu
visibility.

This is a front-end design concern only; it does not implement
production security.

## 12. Interaction and states

Interactive-looking controls must have meaningful prototype behavior.

Where relevant, implement: - Sidebar active state and collapse. -
Dropdown open / select / close. - Tabs. - Checkbox and switch. -
Permission preset selection. - Table sorting and pagination. - Search
and filter UI. - Date range selection. - Modal open / close. - Toast
feedback. - Tooltip. - Form validation display. - Loading and disabled
states.

Avoid dead buttons. If an element is illustrative and non-interactive,
make that clear. Use keyboard-accessible controls and visible focus
states.

## 13. Component Showcase

The initial Dashboard page contains: 1. The AMS operational dashboard. 2.
A dedicated Design / Component Showcase below it.

Group the Showcase into: - Foundations - Typography - Buttons - Form
Controls - Badges and Status - Cards - Tables - Charts - Navigation -
Feedback and Overlays - Token and Cost - Provider and Model -
Permissions - System Monitoring - Activity and Audit

Use anchor navigation or tabs if useful. Keep a clear boundary between
the operational dashboard and showcase; the showcase must not visually
compete with the dashboard.

Implemented Showcase structure uses sixteen anchor-linked groups: ten general
design-system groups plus Token & Cost, Provider & Model, Provider Pricing,
Permissions, Monitoring, and Activity & Logs. Controls demonstrate real
prototype behavior including
multi-select, password visibility, switch, table search/sort/selection/loading,
pagination, tabs, dropdown, stepper, modal, confirmation, toast, tooltip, and
accordion. AMS patterns additionally demonstrate masked credentials, pricing
units, account-scoped permission presets and custom permission states. Chart
examples reuse the shared Chart.js wrapper.

## 14. Responsive behavior

Desktop is primary. Review at: - 1440px --- primary target. - 1280px ---
desktop. - 1024px --- compact desktop / tablet landscape. - 768px ---
tablet. - 390px --- mobile.

Guidelines: - Preserve desktop information hierarchy. - Collapse sidebar
at narrower widths; use a drawer on mobile. - Reflow KPI and chart
grids. - Allow wide tables to scroll horizontally rather than crushing
columns. - Keep page actions accessible. - Prevent page-level horizontal
overflow. - Prioritize desktop quality over mobile polish for this
internal operations console.

## 15. Accessibility

-   Maintain readable contrast.
-   Show keyboard focus.
-   Provide accessible names for icon-only controls.
-   Associate form labels and inputs.
-   Use semantic buttons, links, tables, and headings.
-   Never rely on color alone for status.
-   Keep error messages near the relevant field.
-   Respect reduced-motion preferences.
-   Provide chart summaries or labels beyond color alone.

## 16. Angular implementation conventions

-   Target Angular 19.
-   Use reusable shared components.
-   Separate page composition from shared UI primitives.
-   Separate mock data from presentation components.
-   Centralize tokens in CSS custom properties.
-   Use consistent component naming and input/output contracts.
-   Avoid duplicated styles.
-   Follow established Angular conventions and avoid unnecessary
    dependencies.
-   Verify Astryx compatibility before adopting it.
-   Do not introduce a second conflicting design system.

Suggested structure (adjust to Angular conventions):

``` text
src/
  app/
    core/
    layout/
    shared/
      components/
      styles/
    pages/
      overview/
      placeholder/
    data/
  styles/
```

## 17. Naming conventions

Use predictable names across code, documentation, and the Showcase: -
`Button / Primary` - `Button / Secondary` - `Input / Default` -
`Badge / Status / Success` - `Table / Standard` - `Table / Dense` -
`Chart / Line` - `Card / KPI` - `Permission / Checkbox Group` -
`Pricing / Provider Table`

## 18. Design quality checklist

### Visual consistency

-   Uses shared color, typography, spacing, radius, and shadow tokens.
-   Matches Modern Minimal Enterprise.
-   Uses `#2F9AFF` with restraint.
-   Maintains consistent alignment and component heights.

### Data usability

-   Numeric values are scannable.
-   Units and currencies are explicit.
-   Tables handle long and dense content.
-   Charts have meaningful labels and tooltips.
-   Status is understandable without color alone.

### Interaction

-   Hover, focus, active, disabled, loading, error, and success states
    are considered.
-   Prototype interactions work.
-   No misleading dead controls.

### Architecture

-   Shared components are reusable.
-   Mock data is separated from UI.
-   Tokens are centralized.
-   Library-inspired and custom components look consistent.

### Scope discipline

-   Dashboard is the only fully populated navigation page in the initial
    prototype.
-   Other pages remain placeholders.
-   Provider costs are company-paid external costs.
-   Customer billing and margin remain out of scope.
-   Permission details remain provisional.
-   No production backend integration is implied.

## 19. Document evolution

This is the initial design baseline, not an immutable specification.

When implementation reveals a better solution: 1. Review the proposed
change against the overall design direction. 2. Update shared tokens or
component rules rather than adding isolated exceptions. 3. Update this
document to match approved implementation. 4. Keep shared components
visually consistent. 5. Record significant changes in a short changelog.

The goal is a coherent, extensible design system that can support the
full AMS / AI Ops product as its information architecture and business
requirements are finalized.

## 20. Changelog

### 2026-11-15 --- Token implementation alignment

-   Added canonical semantic color aliases for actions, surfaces, borders,
    text, status, and interaction states while preserving legacy aliases.
-   Expanded the spacing system to a complete 4px multiplier scale so 28px
    page padding no longer requires a one-off value.
-   Simplified the public radius scale to Small, Medium, Large, and Full;
    legacy and exceptional sizes remain compatibility aliases.
-   Renamed elevation by purpose (Subtle, Card, Dropdown, Modal) instead of
    ambiguous size-only names.
-   Added reusable typography classes and explicit tabular numeric behavior
    for operational data.
-   Added shared border, divider, focus, disabled, loading, and motion tokens,
    including reduced-motion behavior.

These changes clarify component intent and make future palette or density
changes possible without editing individual component styles. Existing aliases
were retained to prevent regressions during incremental migration.

### 2026-11-15 --- Overview dashboard prototype

-   Implemented the Overview hierarchy with six KPI patterns, usage and cost
    analytics, operational tables, recent activity, and mock system health.
-   Adopted Chart.js 4.x behind a reusable Angular chart wrapper with CSS
    variable color resolution, tooltips, legends, axes, and reduced-motion
    handling.
-   Kept realistic sample datasets separate from presentation code and added a
    visible Sample Data notice.
-   Added working date-range switching, table filters, and dashboard section
    visibility controls.
-   Verified responsive grid reflow and internal table scrolling at 1440px,
    1280px, 768px, and 390px without page-level horizontal overflow.

### 2026-11-15 --- Interactive Component Showcase

-   Added a clearly separated Component Showcase below all Overview content
    with sticky anchor navigation across ten component groups.
-   Added token-driven examples for typography, button variants and states,
    complete form controls, statuses, cards, enterprise tables, charts,
    navigation, feedback overlays, and supporting UI.
-   Implemented meaningful prototype interactions for search, sorting,
    selection, pagination, loading, tabs, dropdowns, stepper, modal,
    confirmation, toast, tooltip, accordion, switch, password visibility, and
    multi-select.
-   Reused shared Icon, Status Badge, Chart, Spinner, Skeleton, type, and state
    foundations rather than introducing a conflicting visual system.
-   Verified 1440px and 390px layouts with no page-level horizontal overflow;
    wide table content remains internally scrollable.

### 2026-11-15 --- AMS / AI Ops specialized patterns

-   Added six AMS-specific Showcase categories for AI Token & Cost, Provider &
    Model, Provider Pricing, Permission Management, System Monitoring, and
    Activity & Logs.
-   Added reusable operational patterns for token breakdown, cost trend,
    budget progress, Provider and Model status, API connection health, and a
    masked API key example.
-   Added a pricing table capable of representing Token, Character, Image, and
    Audio billing units, with an explicit Sample Data warning.
-   Added account-scoped permission editing with Super Admin, System Admin,
    Product Manager, and Custom presets plus Select All / Deselect All.
-   Added system health and severity-aware activity log patterns using the
    existing status, color, type, spacing, and chart tokens.
-   Verified the six new anchor targets and responsive layouts at 1440px and
    390px; wide operational tables scroll inside their own containers.

### 2026-11-15 --- Dashboard naming

-   Renamed the landing menu item and page title from Overview to Dashboard.
-   Kept the Overview navigation group and the `/overview` route so the
    information architecture and existing links remain stable.
-   Breadcrumb follows the navigation label, so it now displays Dashboard.
