# NoduleRisk — Lung Nodule Malignancy Risk Calculator

## Overview
Static Next.js 15 single-page app that computes pulmonary nodule malignancy risk across five validated models: Mayo Clinic, Brock, Herder, BIMC, and Fleischner 2017/BTS VDT. Designed for clinical decision support — no backend, no auth, no database.

## Tech Stack
TypeScript (strict), Next.js 15 (App Router, `output: 'export'`), React 19, pnpm, CSS custom properties (no Tailwind).

## Commands
- `pnpm dev` — Dev server (port 3000 or 3001)
- `NODE_ENV=production pnpm build` — Production static export to `out/`
- `pnpm start` — Serve the static export locally

> **Note**: `NODE_ENV=production` is required in the build script. If your shell has `NODE_ENV=development` set, the Next.js Turbopack context identity splits and the build fails.

## Architecture
- `lib/models.ts` — All risk model logic (pure functions, no DOM access)
- `components/Calculator.tsx` — Top-level state container (`'use client'`)
- `components/NoduleCard.tsx` — Per-nodule input card
- `components/EdgeTooltip.tsx` — Edge morphology picker with inline SVG
- `components/ResultsTable.tsx` — Results, interpretation, warnings
- `app/page.tsx` — Thin wrapper using `next/dynamic` with `ssr: false`
- `app/globals.css` — CSS custom-property design token system (verbatim from original)

## Deployment
- Static export only (`out/` directory). Deploy to any static host (Vercel, Netlify, GitHub Pages).
- NEVER deploy without explicit approval.

---

## MDD Documentation Handbook

**Before ANY task — quick fix or new feature — read `docs/PROJECT_CONTEXT.md` if it exists.**

Do NOT grep the codebase to understand a feature — read the doc first.
If no doc exists for the feature: run `/mdd <feature>` to create one before writing code.

## Default Context Budget

Unless the task explicitly requires them, do not load these paths into AI context:
- `out/` (static build output)
- `.next/`
- `node_modules/`
- `docs/transcripts/`
- `**/pnpm-lock.yaml`

---

## Critical Rules

### Never Modify Model Logic Without Explicit Instruction
`lib/models.ts` is the canonical source of truth for all five risk models. Do NOT change coefficients, thresholds, or LR values without an explicit request. These values are validated against published literature.

### No SSR for Calculator Components
All calculator components must remain client-side. Never remove `'use client'` or the `ssr: false` dynamic import in `app/page.tsx` — Turbopack SSR prerendering breaks hook-heavy components in this build configuration.

### CSS Tokens Over Inline Styles
Use CSS custom properties from `globals.css` (e.g., `var(--low)`, `var(--accent)`) for all risk-category colors and theme values. Never hardcode hex colors or add Tailwind.

### No Secrets
- NEVER commit `.env` files or API keys — this app has no backend secrets, but the rule stands if any are added
- NEVER hardcode credentials or connection strings

### Plan Mode
For any non-trivial task, start in plan mode. Named steps only. Replace steps when revising a plan, never append.

### CLAUDE.md Is Team Memory
When a mistake is made or a constraint is discovered, add a rule here.

<!-- TESSERA:START v2 -->
## Tessera Graph Policy

**MANDATORY**: Call `graph_continue` as your FIRST tool call every turn.

- If `needs_scan=true`: run `graph_scan` with the project root path
- If `skip=true`: project too small, proceed normally
- If error: proceed normally without graph routing for this turn
- Read all `recommended_files` via `graph_read` before other exploration
- Obey confidence caps:
  - high: no supplementary greps or reads
  - medium: up to max_supplementary_greps greps + max_supplementary_files reads
  - low: up to max_supplementary_greps greps + max_supplementary_files reads
- After edits: call `graph_register_edit` with file::symbol notation and summary
  - If `graph_continue` returned `active_checklist`, pass `checklist_item_id` for the item you just completed — this marks it done without keyword matching
  - If no active checklist or the edit doesn't map to a specific item, omit `checklist_item_id` (keyword fallback applies)
- When you identify an architectural decision: call `graph_lock_decision` with a one-sentence summary, scope (`"file"` | `"module"` | `"project"`), and the files it applies to
- Max 1 `graph_retrieve` per turn
- No raw grep/rg/bash file reads before `graph_continue`
<!-- TESSERA:END -->
