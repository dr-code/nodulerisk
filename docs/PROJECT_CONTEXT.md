# Project Context

## Key Commands
| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Static export to `out/` — requires `NODE_ENV=production` (already in script) |
| `pnpm start` | Serve `out/` locally to verify before deploy |
| `pnpm test` | Run unit tests (vitest) |
| `pnpm typecheck` | TypeScript type-check (no emit) |

## Feature → Doc Lookup

| Working on... | Read first |
|---------------|------------|
| Any risk model (Mayo, Brock, Herder, BIMC, Fleischner, VDT) | `lib/models.ts` — coefficients are canonical |
| Calculator state / nodule count / auto-select | `components/Calculator.tsx` |
| Per-nodule input form | `components/NoduleCard.tsx` |
| Results table / warnings / interpretation box | `components/ResultsTable.tsx` |
| Edge morphology tooltip / SVG | `components/EdgeTooltip.tsx` |
| Styling / design tokens | `app/globals.css` |
| Architecture overview | `docs/ARCHITECTURE_SUMMARY.md` (brief) · `docs/ARCHITECTURE.md` (full) |

## Common Gotchas

- **`NODE_ENV=production` is required for build.** If your shell has `NODE_ENV=development`, Next.js Turbopack splits context and the build fails. The `build` script already includes it.
- **No SSR — never remove `ssr: false`.** `app/page.tsx` lazy-loads Calculator with `{ ssr: false }`. Removing it breaks the app during static export.
- **Spiculation and edge morphology are bidirectionally synced.** Toggling the spiculation dropdown forces `edges: 'spiculated'` and vice versa. See `handleNoduleChange` in `Calculator.tsx`.
- **BIMC returns 0 for prior < 1 or > 99.** The prior input enforces `min={1}` in the UI but there is no JS guard — if prior hits 0, BIMC silently shows 0%.
- **Herder is null when PET toggle is off.** All code that uses `herder` must handle `null`.

## Reference Docs
- Architecture: `docs/ARCHITECTURE_SUMMARY.md` (brief) · `docs/ARCHITECTURE.md` (full)
- Decisions: `docs/DECISIONS.md`
- Transcripts: `docs/transcripts/`
