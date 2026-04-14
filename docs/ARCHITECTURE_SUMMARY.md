# Architecture Summary

> Full architecture detail: `docs/ARCHITECTURE.md`

## System Overview

NoduleRisk is a static single-page application. There is no backend, no API, no database, and no authentication. All computation runs in the browser. The app is exported as a static HTML/JS bundle (`out/`) and deployed to any static host.

## Service Boundaries

| Layer | Responsibility | Does NOT |
|-------|---------------|----------|
| `lib/models.ts` | All risk model math (pure functions, no DOM) | Touch React or browser APIs |
| `components/Calculator.tsx` | Top-level state container, wires inputs → models → display | Compute model logic directly |
| `components/NoduleCard.tsx` | Per-nodule input form | Hold state |
| `components/ResultsTable.tsx` | Render computed results, warnings, interpretation | Compute anything |
| `components/EdgeTooltip.tsx` | Edge morphology picker with inline SVG | Communicate beyond its props |
| `app/page.tsx` | Next.js App Router entry point, lazy-loads Calculator | Contain any logic |

## Data Flow

1. User changes an input → `Calculator.tsx` state updates
2. On every render, `Calculator.tsx` calls model functions from `lib/models.ts` with current state
3. Results (`mayo`, `brock`, `herder`, `bimc`, `vdt`, `fleischner`) and warnings are passed as props to `ResultsTable.tsx`
4. `ResultsTable.tsx` renders results; no callbacks back to parent

## Core Invariants

- **No SSR**: `app/page.tsx` uses `dynamic(..., { ssr: false })`. Never remove this.
- **No model logic in components**: All math lives in `lib/models.ts`. Components are display-only.
- **No coefficient changes without explicit instruction**: `lib/models.ts` values are validated against published literature.
- **CSS tokens only**: Colors via `var(--low)`, `var(--accent)`, etc. No hardcoded hex.
- **Static export**: `next.config.ts` sets `output: 'export'`. No server-side features.

## Key Decisions

1. **Pure functions for models** — `lib/models.ts` has zero side effects, making it trivially testable and auditable against literature values.
2. **No Tailwind** — CSS custom property token system from the original single-file app was preserved verbatim.
3. **`ssr: false` dynamic import** — Turbopack SSR prerendering breaks hook-heavy components in this build configuration.
