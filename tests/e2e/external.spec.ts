// ── External validation: our lib vs nodule.pulm.icu ───────────────────────
//
// Verifies that our model formulas produce the same results as the reference
// implementation at nodule.pulm.icu, which shares the same field IDs,
// toggle structure, and Fleischner string constants as our app.
//
// 29 single-nodule patients (P01–P29). Multi-nodule cases (P30–P35) are
// excluded — the external site's single-nodule form does not map cleanly.
//
// Herder (row 2) is NOT asserted here. Validate it manually against the
// nodule.pulm.icu Herder result. The reference inputs are in the
// HERDER MANUAL REFERENCE table at the top of tests/fixtures/patients.ts.
//
// Curated 6-patient smoke test (baseline, high-risk, biopsy, PET, VDT, PET+VDT):
//   pnpm test:e2e:external:quick
//   or: pnpm test:e2e:external --grep @curated
//
// Uses playwright.external.config.ts (no webServer — no local app needed).

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  mayoFor, brockFor, bimcFor, fleischFor, vdtFor, pct,
} from '../../lib/models';
import { PATIENTS, getPatient } from '../fixtures/patients';
import type { PatientFixture } from '../fixtures/patients';

// ── Patient sets ───────────────────────────────────────────────────────────

const SINGLE_NODULE_IDS = [
  'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10',
  'P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P20',
  'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27', 'P28', 'P29',
];

// 6-patient smoke test — covers every combination of toggle state and context
const CURATED_IDS = new Set(['P01', 'P02', 'P05', 'P13', 'P21', 'P28']);

// ── Result readers ─────────────────────────────────────────────────────────
//
// The result cell structure is:
//   <td><span class="nod-used">Nodule 1</span><br><p class="pval …">1.7%</p></td>
//
// Calling textContent() on the <td> concatenates the span and p without any
// separator, producing "Nodule 11.7%" for a 1.7% result — the "1" from
// "Nodule 1" merges with "1.7%", breaking percentage regexes.
//
// Fix: target the .pval child directly (same class used in our ResultsTable).
// Fleischner uses .fleisch-rec; VDT result also uses .pval.

// ── Form filler ────────────────────────────────────────────────────────────

async function fillExternal(page: Page, fixture: PatientFixture): Promise<void> {
  const pt  = fixture.patient;
  const nod = fixture.nodules[0]; // single-nodule only
  const ds  = fixture.ds;

  // Data toggles — same .tog container / .sw switch structure as our app
  if (ds.pet) await page.locator('.tog').filter({ hasText: 'FDG-PET' }).locator('.sw').click();
  if (ds.vdt) await page.locator('.tog').filter({ hasText: 'Two-point' }).locator('.sw').click();
  if (ds.enh) await page.locator('.tog').filter({ hasText: 'CT enhancement' }).locator('.sw').click();
  if (ds.den) await page.locator('.tog').filter({ hasText: 'Min focal' }).locator('.sw').click();

  // Demographics — same IDs as our app
  await page.locator('#age').fill(String(pt.age));
  await page.locator('#sex').selectOption(pt.sex);
  await page.locator('#smoker').selectOption(pt.smoker);
  if (pt.packyears > 0) await page.locator('#packyears').fill(String(pt.packyears));
  await page.locator('#priorcancer').selectOption(pt.priorcancer ? 'yes' : 'no');
  await page.locator('#familyhx').selectOption(pt.familyhx ? 'yes' : 'no');
  await page.locator('#emphysema').selectOption(pt.emphysema ? 'yes' : 'no');
  await page.locator('#ctx').selectOption(pt.ctx);
  await page.locator('#prior').fill(String(pt.prior));

  // Nodule 0 — external site starts with one nodule visible by default.
  // If not (e.g. different deployment state), click "+" first.
  const n0d = page.locator('#n0_d');
  if (!await n0d.isVisible()) {
    await page.locator('.ncount-btn').nth(1).click();
  }
  await n0d.waitFor({ state: 'visible' });

  await n0d.fill(String(nod.d));
  await page.locator('#n0_nt').selectOption(nod.nt);
  await page.locator('#n0_loc').selectOption(nod.loc);
  await page.locator('#n0_sp').selectOption(nod.sp ? 'yes' : 'no');
  if (!nod.sp) await page.locator('#n0_edges').selectOption(nod.edges);

  // PET inputs (only visible after toggle)
  if (ds.pet) {
    await page.locator('#n0_pet').selectOption(nod.pet);
    if (nod.suv > 0) await page.locator('#n0_suv').fill(String(nod.suv));
  }

  // VDT inputs (only visible after toggle)
  if (ds.vdt) {
    await page.locator('#n0_s1').fill(String(nod.s1));
    await page.locator('#n0_s2').fill(String(nod.s2));
    if (nod.d1) await page.locator('#n0_d1').fill(nod.d1);
    if (nod.d2) await page.locator('#n0_d2').fill(nod.d2);
  }

  // Wait for auto-calculation — Mayo .pval must be visible
  await expect(
    page.locator('table tbody tr').nth(0).locator('.pval').first()
  ).toBeVisible({ timeout: 10_000 });
}

// ── Herder manual reference ────────────────────────────────────────────────
//
// Run with: pnpm test:e2e:external --grep "herder-inputs"
// Prints BTS inputs for every PET patient. Enter each row manually at
// nodule.pulm.icu and compare the displayed Herder% to the Expected column.

test('herder-inputs: print manual reference table for nodule.pulm.icu Herder row', async () => {
  const petPatients = PATIENTS.filter((f) => f.ds.pet);

  console.log('\n' + '='.repeat(92));
  console.log('  HERDER MANUAL REFERENCE — validate against nodule.pulm.icu Herder row');
  console.log('='.repeat(92));
  console.log(
    'Patient'.padEnd(10) + 'Age'.padEnd(6) + 'EverSmoke'.padEnd(12) +
    'Size(mm)'.padEnd(11) + 'Spic'.padEnd(7) + 'UpperLobe'.padEnd(12) +
    'PET'.padEnd(12) + 'Expected Herder%'
  );
  console.log('-'.repeat(92));

  for (const fixture of petPatients) {
    const nodule  = fixture.nodules[0];
    const patient = fixture.patient;
    const { herderFor } = await import('../../lib/models');
    const result = herderFor(nodule, patient, fixture.ds);
    const label  = fixture.nodules.length > 1 ? `${fixture.id}-N1` : fixture.id;

    console.log(
      label.padEnd(10) +
      String(patient.age).padEnd(6) +
      (patient.smoker !== 'never' ? 'Yes' : 'No').padEnd(12) +
      String(nodule.d).padEnd(11) +
      (nodule.sp ? 'Yes' : 'No').padEnd(7) +
      (nodule.loc === 'upper' ? 'Yes' : 'No').padEnd(12) +
      (nodule.pet.charAt(0).toUpperCase() + nodule.pet.slice(1)).padEnd(12) +
      (result !== null ? pct(result) : 'N/A')
    );
  }

  console.log('='.repeat(92) + '\n');
});

// ── Main validation loop ───────────────────────────────────────────────────

for (const id of SINGLE_NODULE_IDS) {
  const fixture  = getPatient(id);
  const isCurated = CURATED_IDS.has(id);

  test(
    `${fixture.id}: ${fixture.label}`,
    isCurated ? { tag: ['@curated'] } : {},
    async ({ page }) => {
      await page.goto('https://nodule.pulm.icu');
      await fillExternal(page, fixture);

      const nod  = fixture.nodules[0];
      const pt   = fixture.patient;
      const ds   = fixture.ds;
      const rows = page.locator('table tbody tr');

      // ── Expected values from our lib ─────────────────────────────────
      const expMayo    = pct(mayoFor(nod, pt));
      const expBrock   = pct(brockFor(nod, pt, 1));
      const expBimc    = pct(bimcFor(nod, pt, ds));
      const expFleisch = fleischFor(nod, ds).rec;
      const vdtVal     = vdtFor(nod, ds);
      const expVdt     = ds.vdt && vdtVal !== null && vdtVal > 0
        ? Math.round(vdtVal) + ' days'
        : null;

      // ── Mayo (row 0) — read .pval directly, not the whole cell ──────
      const mayoVal = await rows.nth(0).locator('.pval').first().textContent({ timeout: 5000 }) ?? '';
      expect(mayoVal.trim(), `${id} Mayo`).toBe(expMayo);

      // ── Brock (row 1) ────────────────────────────────────────────────
      const brockVal = await rows.nth(1).locator('.pval').first().textContent({ timeout: 5000 }) ?? '';
      expect(brockVal.trim(), `${id} Brock`).toBe(expBrock);

      // ── Herder (row 2) — skipped; validate manually ──────────────────
      // see HERDER MANUAL REFERENCE table in tests/fixtures/patients.ts

      // ── BIMC (row 3) ─────────────────────────────────────────────────
      const bimcVal = await rows.nth(3).locator('.pval').first().textContent({ timeout: 5000 }) ?? '';
      expect(bimcVal.trim(), `${id} BIMC`).toBe(expBimc);

      // ── Fleischner (row 4) — .fleisch-rec holds the primary rec string
      const fleischVal = await rows.nth(4).locator('.fleisch-rec').textContent({ timeout: 5000 }) ?? '';
      expect(fleischVal.trim(), `${id} Fleischner`).toBe(expFleisch);

      // ── VDT (row 5) — .pval holds "146 days" etc. ───────────────────
      if (expVdt !== null) {
        const vdtVal = await rows.nth(5).locator('.pval').first().textContent({ timeout: 5000 }) ?? '';
        expect(vdtVal.trim(), `${id} VDT`).toBe(expVdt);
      }
    }
  );
}
