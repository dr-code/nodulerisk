// ── App E2E tests: our app vs lib ─────────────────────────────────────────
//
// For every patient fixture, this test:
//   1. Navigates to localhost:3000
//   2. Fills the form via fillForm()
//   3. Reads the displayed percentages from the results table
//   4. Computes expected values by calling lib functions directly
//   5. Asserts exact string equality (both sides use pct(), same rounding)
//
// A passing run means the UI is correctly wiring inputs to model functions
// and displaying the outputs without transcription errors.

import { test, expect } from '@playwright/test';
import { PATIENTS } from '../fixtures/patients';
import {
  mayoFor,
  brockFor,
  herderFor,
  bimcFor,
  fleischFor,
  vdtFor,
  pct,
} from '../../lib/models';
import { fillForm, readResults, autoSelectIndex } from './helpers';

for (const fixture of PATIENTS) {
  test(`${fixture.id}: ${fixture.label}`, async ({ page }) => {
    await page.goto('/');
    await fillForm(page, fixture);

    const selIdx = autoSelectIndex(fixture);
    const activeNodule = fixture.nodules[selIdx];
    const noduleCount = fixture.nodules.length;

    // ── Compute expected values ─────────────────────────────────────────
    const expectedMayo  = pct(mayoFor(activeNodule, fixture.patient));
    const expectedBrock = pct(brockFor(activeNodule, fixture.patient, noduleCount));
    const expectedBimc  = pct(bimcFor(activeNodule, fixture.patient, fixture.ds));

    const herderVal   = herderFor(activeNodule, fixture.patient, fixture.ds);
    const expectedHerder = herderVal !== null ? pct(herderVal) : null;

    const vdtVal = vdtFor(activeNodule, fixture.ds);
    const expectedVdtDays = (vdtVal !== null && vdtVal > 0)
      ? Math.round(vdtVal) + ' days'
      : null;

    const expectedFleisch = fleischFor(activeNodule, fixture.ds).rec;

    // ── Read displayed values ───────────────────────────────────────────
    const displayed = await readResults(page);

    // ── Assert ──────────────────────────────────────────────────────────
    expect(displayed.mayo.trim(),   `${fixture.id} Mayo`).toBe(expectedMayo);
    expect(displayed.brock.trim(),  `${fixture.id} Brock`).toBe(expectedBrock);
    expect(displayed.bimc.trim(),   `${fixture.id} BIMC`).toBe(expectedBimc);
    expect(displayed.fleisch.trim(),`${fixture.id} Fleischner`).toBe(expectedFleisch);

    if (expectedHerder !== null) {
      expect(displayed.herder?.trim(), `${fixture.id} Herder`).toBe(expectedHerder);
    }

    if (expectedVdtDays !== null) {
      expect(displayed.vdt?.trim(), `${fixture.id} VDT`).toBe(expectedVdtDays);
    }
  });
}
