# Architecture

> **This document is AUTHORITATIVE. No exceptions. No deviations.**
> **ALWAYS read this before making architectural changes.**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (client only)                     │
│                                                                   │
│  app/page.tsx                                                     │
│    └─ dynamic import (ssr: false)                                 │
│         └─ components/Calculator.tsx  (state container)          │
│               ├─ components/NoduleCard.tsx × 1–6                 │
│               │     └─ components/EdgeTooltip.tsx (conditional)  │
│               └─ components/ResultsTable.tsx                     │
│                                                                   │
│  lib/models.ts  ←── pure functions, no DOM, no React             │
│    mayoFor · brockFor · herderFor · bimcFor · fleischFor · vdtFor│
│    getWarnings · scoreNodule · bimcLRsFor                         │
│                                                                   │
│  No network calls. No server. No database. No auth.              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ pnpm build
                          ▼
                      out/  (static export)
                          │
                          │ deploy
                          ▼
              Any static host (Vercel / Netlify / GitHub Pages)
```

---

## Service Responsibilities

| File | Does | Does NOT |
|------|------|----------|
| `lib/models.ts` | Risk model computation, type definitions, LR tables | Touch DOM, import React |
| `Calculator.tsx` | Own all state, call models, distribute props | Compute model math |
| `NoduleCard.tsx` | Render per-nodule inputs, call onChange | Hold state, compute |
| `ResultsTable.tsx` | Render results, warnings, interpretation | Compute or hold state |
| `EdgeTooltip.tsx` | Render edge picker SVG, emit selection | Know about other components |
| `app/page.tsx` | Next.js route entry, lazy-load Calculator | Contain any app logic |
| `app/globals.css` | Design token system (CSS custom properties) | Import external stylesheets |

---

## Data Flow

Every keystroke:
1. User changes input in `NoduleCard` or patient section
2. `handleNoduleChange` / `setPatientField` in `Calculator` updates state
3. React re-renders; `Calculator` calls model functions synchronously
4. Results and warnings are passed down as props to `ResultsTable`
5. `ResultsTable` renders — no state, no callbacks up

Nodule auto-selection:
- `autoSelect()` in `Calculator` scores each nodule with `scoreNodule()` and returns the index with the highest probability
- Overridden by user click (`manualSel = true`); reset by the "↺ Auto-select" badge

---

## Technology Choices

| Decision | Choice | Why |
|----------|--------|-----|
| Language | TypeScript (strict) | Type safety, catches coefficient type errors |
| Framework | Next.js 15 App Router | Static export, modern React 19 |
| Styling | CSS custom properties | Preserved from validated single-file original |
| Testing | Vitest | Zero-config, fast, works with pure TS modules |
| Build output | `output: 'export'` | No server needed; deploys anywhere |

---

## If You Are About To...

- **Add a backend / database** → STOP. This is intentionally a static app. Discuss first.
- **Remove `'use client'` or `ssr: false`** → STOP. Turbopack SSR breaks hook-heavy components.
- **Change a coefficient in `lib/models.ts`** → STOP. Verify against the published paper first.
- **Add Tailwind** → STOP. CSS custom properties are the design system.
- **Add a new model** → Add pure function to `lib/models.ts`, add tests, wire into `Calculator`, display in `ResultsTable`.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-13 | Filled in from MDD audit — replaced starter-kit template |
