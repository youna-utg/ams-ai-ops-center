# Ops Center

Angular 19 design-system and UI publishing prototype for the Ops Center console. AMS remains the internal system name.

- **Stack:** Angular 19 · SCSS · CSS Variables · Chart.js · Light theme · Desktop-first
- **Data:** Mock only (no backend)
- **Design source of truth:** [`DESIGN.md`](./DESIGN.md)

## Prerequisites

- Node.js 20+ (project verified with Node 22)
- npm 10+

## Scripts

```bash
npm start          # ng serve (http://localhost:4200)
npm run build      # production build
npm test           # unit tests
```

## Directory structure

```text
src/
  app/
    core/           # config, models, services
    shared/         # reusable UI primitives
    layout/         # shell, sidebar, header
    pages/
      overview/     # Dashboard page
      placeholder/  # non-Overview menu stubs
    data/
      mocks/        # mock datasets (separated from UI)
  styles/
    tokens/         # design tokens (CSS variables)
    base/           # reset / base styles
    utilities/      # shared utilities
```

## Current phase

Application shell, design-token foundation, mock-data Dashboard, and
the interactive Component Showcase are implemented.

**Next phase:** AMS-specific components.
