# AMS / AI Ops Center --- Design System

**Version:** 0.2\
**Status:** Aligned with the published Dashboard and Component Showcase\
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

Use `#2F9AFF` for primary actions, links, focus accents, and the main
chart series. Use pale tints for large selected surfaces on light
content. For small text on white, use a darker blue token when contrast
requires it. The sidebar is a dark navigation surface; its selected item
uses an 18% wash of `#2F9AFF` with `--color-primary-400` text and icon.

### Neutral palette

  Token                   Value
  ----------------------- -----------
  `--color-neutral-0`     `#FFFFFF`
  `--color-neutral-25`    `#FDFDFD`
  `--color-neutral-50`    `#F7F8FA`
  `--color-neutral-100`   `#F1F2F4`
  `--color-neutral-200`   `#E9EBEF`
  `--color-neutral-300`   `#D8DCE2`
  `--color-neutral-400`   `#A6ABB4`
  `--color-neutral-500`   `#727883`
  `--color-neutral-600`   `#555B66`
  `--color-neutral-700`   `#383D46`
  `--color-neutral-800`   `#242830`
  `--color-neutral-900`   `#15181E`

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
    focus, and the main data series. Sidebar selection uses
    `--color-neutral-100` tinted with 5% `--color-primary`, with black
    text rather than a solid primary fill.
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
-   `--color-secondary: #383D46` (`--color-neutral-700`)
-   `--color-background: #F8F8F8`
-   `--color-surface: #FFFFFF`
-   `--color-surface-subtle: #F7F8FA`
-   `--color-surface-sunken: #F7F8FA` (table header bands)
-   `--color-border: #E9EBEF`
-   `--color-text-primary: #15181E`
-   `--color-text-secondary: #555B66`
-   `--color-text-muted: #727883`

Chart series stay on their own tokens so data colors do not collide with
status colors:

-   Primary `#2F9AFF`, secondary `#38BDF8`, tertiary `#818CF8`, quaternary
    `#2DD4BF`, muted `#D8DCE2`.
-   Tooltip surface `#15181E`. Grid lines use 6% of `#15181E`.

Sidebar tokens live beside the light palette. Do not reuse light-surface
tokens for the navigation column.

-   `--color-sidebar: #171A20`
-   `--color-sidebar-ink: #F4F6F8`
-   `--color-sidebar-label: #8B919C`
-   `--color-sidebar-active: #4DADFF`
-   Selected wash: 18% `#2F9AFF`. Hover wash: 6% white. Pressed wash: 10%
    white.

Legacy aliases such as `--color-bg-app`, `--color-bg-surface`, and
`--color-border-default` remain temporarily mapped to canonical tokens so
existing components can migrate without visual regressions.

## 4. Typography

Latin text, English UI labels, and figures use Figtree. Hangul uses
Pretendard Variable. Both are loaded, with Noto Sans KR and the system
sans as fallbacks.

`--font-family-sans` and `--font-family-data` share one stack:

`Figtree, "Figtree Variable", "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

The browser picks Figtree for Latin glyphs and Pretendard for Hangul, so
mixed sentences stay in one declaration. Figtree is loaded at weights
400 through 700. Pretendard Variable covers the same weights.

  Style          Size     Weight   Line height Usage
  ------------ ------ ---------- ------------- --------------------------
  KPI            32px        700          1.15 Dashboard and gauge values
  Stat large     28px        700           1.1 Featured showcase metrics
  Stat           22px        700           1.1 Secondary metrics
  Brand          18px        800             1 Sidebar product name
  H1             24px        700          1.35 Page title
  H2             20px        700           1.4 Section title
  H3             16px        600          1.45 Card / subsection title
  H4             14px        600          1.45 Minor heading
  Body large     15px        400           1.6 Intro copy
  Body           14px        400          1.55 Main UI text and menu items
  Body small     13px        400           1.5 Supporting text
  Label          13px   500--600           1.4 Form / data label
  Caption        12px        400          1.45 Metadata and nav group labels
  Micro          11px        500           1.4 Badges, table heads, hints
  Numeric        14px   500--600           1.4 Metrics / table values

Do not introduce 9px or 10px text. Micro is the smallest size. Table
column headers use Micro, semibold, uppercase, with slight tracking.
Navigation group labels stay sentence case.

Use tabular numerals for costs, tokens, percentages, counts, and dates.
Keep units and precision consistent within a table or chart.

Implementation uses size, weight, line-height, and letter-spacing CSS
variables plus reusable `.text-*` classes. Numeric / Data uses the same
Figtree family through `--font-family-data`, with
`font-variant-numeric: tabular-nums lining-nums slashed-zero` and the
`.text-numeric` / `.text-data` classes. This prevents column jitter and
improves comparison of costs, token counts, percentages, dates, and
durations.

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
  -------------------- ------- ---------------------------------
  `--radius-xs`            4px Checkboxes and tight marks
  `--radius-small`         6px Inputs, buttons, menus items
  `--radius-medium`       12px Menus, popovers, inset panels
  `--radius-large`        16px Cards, dialogs, page panels
  `--radius-full`        999px Pills, avatars, filter chips

Content cards and page panels use 16px. Fields and rectangular buttons
use 6px. Search fields, date-range triggers, and toolbar chips are pills.
Do not make every control a pill. Compatibility aliases `--radius-sm`,
`--radius-md`, and `--radius-lg` map to Small, Medium, and Large.

### Borders and shadows

-   Default border: 1px solid `--color-border`.
-   Use that border on inputs, popovers, alerts, and status badges.
-   Cards are white and borderless. The `#F8F8F8` canvas separates them.
    Table regions use dividers and a sunken header, not an outer card
    border.
-   Reserve elevation for menus, popovers, dialogs, and the mobile drawer.
-   Do not nest a bordered card inside another card.

Elevation tokens, tinted with the current ink `#15181E`:

-   `--shadow-subtle: 0 1px 3px rgb(21 24 30 / 3.5%)` for small controls.
-   `--shadow-card: 0 4px 14px rgb(21 24 30 / 4.5%)` when a white card needs
    more separation than the canvas already gives.
-   `--shadow-dropdown: 0 10px 28px rgb(21 24 30 / 9%)` for dropdowns,
    menus, and popovers.
-   `--shadow-modal: 0 20px 48px rgb(21 24 30 / 14%)` for modals and the
    mobile navigation drawer.

Dashboard and showcase cards are white, borderless, and use Large radius.
They separate from `#F8F8F8` by surface contrast. Keep a 1px border on
inputs, popovers, alerts, and status badges. Do not nest a bordered card
inside another card.

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
-   Expanded sidebar: 260px.
-   Collapsed sidebar: approximately 72px.
-   Header: approximately 64px high.
-   Main content padding: 28--32px.
-   App background: `--color-bg-app`.
-   Content surfaces: white.

### Sidebar

-   Dark surface `#171A20`, full viewport height, 1px translucent divider.
-   Service identity at top: Ops Center wordmark at 18px extrabold, with
    AMS remaining the small product label where the breadcrumb needs it.
-   Group labels are 12px semibold `#8B919C`, sentence case.
-   Menu items are 32px high, 14/20, 10px radius, 16px icons.
-   Idle label `#F4F6F8`. Idle icon `#A6ABB4`.
-   Active item: `#4DADFF` text and icon at weight 500, on an 18% primary
    wash. No side indicator.
-   Hover is a 6% white wash. Pressed is 10% white.
-   Keyboard focus is a 2px white outline at 72% opacity.
-   Expanded width is 260px. From 1100px down to 901px the sidebar stays
    visible but collapses to 72px and hides labels. At 900px and below it
    becomes an off-canvas drawer.
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
show the page title and the shared placeholder description, "해당 영역의
기능은 아직 확정되지 않았습니다." Do not invent detailed workflows.

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
Sizes use one height scale:

-   Small `--control-height-sm`: 32px
-   Medium `--control-height-md`: 36px
-   Large `--control-height-lg`: 40px

Medium is the default for buttons, text inputs, selects, and toolbar
chips. Rectangular buttons use `--radius-small`. Filter, search, and
date-range triggers use `--radius-full`. Primary is `#2F9AFF` with white
text. Secondary is neutral-700. Danger uses the danger token, and its
hover moves to the darker danger text color.

States: Default, Hover, Focus-visible, Active, Disabled, Loading.

Icon-only buttons need accessible labels. Keyboard focus uses the shared
2px primary outline, or the 3px focus ring on fields. Do not remove the
focus ring to make a control look quieter.

### Form controls

-   Text input
-   Search input
-   Password input
-   Textarea
-   Select
-   Multi-select
-   Checkbox. The checked and indeterminate marks are white on the
    primary fill.
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

Implemented card surface: white, no border, `--radius-large` (16px), and
20px padding on standard panels (`--space-5`). KPI cards use 16px padding.
Do not add a second border or shadow unless the card is a menu, dialog, or
a semantic alert. Nested metrics inside a card use `--color-surface-subtle`
with `--radius-medium`, not another full card.

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

Desktop is primary. Review at 1440px, 1280px, 1024px, 768px, and 390px.
The layout keys off the viewport, with the sidebar width included.

Implemented breakpoints:

-   **1440px and 1280px.** Sidebar stays expanded at 260px. KPI cards use
    `auto-fit` with a 240px minimum, so values such as currency do not
    collapse into a six-column row. Usage charts stay side by side until
    1199px. Cost charts become two columns at 1399px, and the third chart
    spans the row.
-   **1024px.** Sidebar collapses to the 72px icon rail (1100px and
    below). Page padding tightens to 24px. Usage, gauge, and the activity
    row stack to one column.
-   **768px.** Sidebar is already a drawer (900px and below). Page actions
    wrap. KPI cards fall to one or two columns from the 240px minimum.
    Chart and cost grids become a single column. Table toolbars stack, and
    wide tables scroll inside their own containers.
-   **390px.** Page padding is 20px by 16px. Popovers pin to the viewport
    edges. Header search collapses to an icon until focused. No page-level
    horizontal overflow.

Guidelines: - Preserve the dashboard hierarchy. - Keep wide tables
scrollable instead of crushing columns. - Keep page actions reachable. -
Prioritize desktop quality for this internal console.

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

## 18. Component usage rules

Use the shared tokens and the existing Angular pieces. Do not restyle one
screen with a local palette.

-   **Color.** Components read semantic aliases (`--color-primary`,
    `--color-surface`, `--color-text-secondary`, status tokens). Primitive
    ramps and sidebar tokens stay in the token files.
-   **Type.** Use the scale in Section 4. KPI values use `--font-size-kpi`.
    Metadata uses Caption or Micro. Numbers that are compared use
    `.text-numeric` / `.text-data` and tabular figures.
-   **Space.** Use `--space-*`. Page padding is `--page-padding` (28px) and
    steps down at 1099px and 767px. Section gap on the dashboard is 32px.
-   **Radius and elevation.** Cards and showcase blocks use Large. Fields
    and rectangular buttons use Small. Pills are only for search, filters,
    chips, badges, and avatars. Shadows are for overlays, not for every
    card.
-   **Buttons.** One of Primary, Secondary, Outline, Ghost, or Danger, at
    32 / 36 / 40px. One primary action per local group.
-   **Forms.** Every field has a visible label. Errors sit under the field
    in danger text. Focus always shows the ring, including error and
    success.
-   **Tables.** Names align left. Comparable numbers align right. Headers
    use the sunken surface, Micro uppercase. Rows hover with
    `--color-hover`. Selected rows may use the primary subtle fill. Wide
    tables scroll inside `.table-scroll`.
-   **Charts.** Go through `ChartComponent`. Pass token `var(...)` colors.
    Primary series is `#2F9AFF`. Pair color with a legend or label.
-   **Status.** Use `app-status-badge`. Color is never the only signal.
-   **Feedback.** Alerts, toasts, dialogs, and empty states use the same
    status and surface tokens. Dialogs have a title, description, and an
    explicit dismiss control.
-   **AMS patterns.** Token, cost, provider, pricing, permission,
    monitoring, and activity examples stay in the showcase and consume the
    same tokens. Sample credentials and prices stay fictional.
-   **Structure.** Pages compose layout and shared components. Mock data
    stays in `src/app/data/mocks`. Do not add a second component library.

## 19. Design quality checklist

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

## 20. Document evolution

This is the initial design baseline, not an immutable specification.

When implementation reveals a better solution: 1. Review the proposed
change against the overall design direction. 2. Update shared tokens or
component rules rather than adding isolated exceptions. 3. Update this
document to match approved implementation. 4. Keep shared components
visually consistent. 5. Record significant changes in a short changelog.

The goal is a coherent, extensible design system that can support the
Ops Center product as its information architecture and business
requirements are finalized. AMS remains the internal system name.

## 21. Changelog

### 2026-11-16 --- Design audit alignment

-   Recorded the implemented neutral ramp, `#F8F8F8` canvas, 12/16px radius
    scale, and current elevation values so the document matches the UI.
-   Documented the dark sidebar, borderless 16px cards, pill filters, and
    the 32/36/40px control scale.
-   Added Micro (11px) as the smallest text size and removed 9px and 10px
    type from the interface.
-   Kept KPI cards on a 240px minimum so currency and labels stay readable
    at 1440px and 1280px instead of collapsing into six narrow columns.
-   Restored keyboard focus rings on fields, including error and success,
    and pointed chart tooltip, grid, and muted series at the current ink.
-   Added component usage rules for color, type, tables, charts, and AMS
    patterns.

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

### 2026-11-15 --- Interaction and state completion

-   Audited all interactive-looking controls and connected previously static
    buttons to visible mock outcomes or meaningful navigation.
-   Added working button loading, dynamic form validation success/error,
    search feedback, date-range validation, synchronized table selection, and
    result-aware pagination.
-   Added keyboard-aware Tabs, Escape dismissal for Showcase overlays,
    actionable Dropdown items, connected Tooltip semantics, and asynchronous
    Modal save feedback.
-   Preserved account-specific permission presets and custom states when
    switching administrators; added save loading and success confirmation.
-   Added Provider Pricing action feedback and a cycling Severity filter for
    Activity & Logs.
-   Completed Hover, Focus, Active, Disabled, Loading, Error, and Success
    styling for the new interactive states without backend dependencies.

### 2026-11-15 --- SideNav visual alignment

-   Restyled the application sidebar to follow the Astryx SideNav specimen:
    Figtree 14/20 menu type, 12/20 semibold section labels, 16/24 product
    heading, 32px items, 10px radius, and 16px icons.
-   Replaced the blue selection treatment with black text, a gray idle icon,
    and neutral washes: hover 5%, selected 6% at weight 500, pressed 10%.
-   Kept the existing navigation structure, collapse behavior, mobile drawer,
    and keyboard focus outline. Expanded width is 260px.

### 2026-11-15 --- Shared Latin type and blue-gray selection

-   Moved Figtree from the sidebar into the shared type stack so English
    labels, headings, and figures use one Latin face.
-   Loaded Pretendard Variable for Hangul and kept it after Figtree, so
    mixed Korean sentences resolve without a separate English style.
-   Pointed numeric and data styles at the same family and retained
    tabular figures.
-   Recolored the selected sidebar item from a 6% black wash to an 8%
    wash of the blue-gray secondary `#334155`, keeping the same lightness.
-   Raised the blue in that selection to a 16% wash of `#2F9AFF` so the
    active item reads as pale blue while the text stays black.
-   Pulled that blue back toward gray by tinting `#F1F5F9` with 5%
    `#2F9AFF`.

### 2026-11-15 --- Ops Center naming

-   Set the browser title and sidebar title to Ops Center. Kept AMS as
    the small sidebar label and the breadcrumb root.
-   Replaced placeholder page descriptions with one sentence: 해당 영역의
    기능은 아직 확정되지 않았습니다.
-   Colored the selected sidebar label and icon with
    `--color-primary-700` so both read as blue on the pale selection wash.

### 2026-11-15 --- Checkbox mark

-   Replaced the native checkbox glyph, which rendered black on the
    primary blue, with an explicit white check and indeterminate dash.
