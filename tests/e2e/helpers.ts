// ── E2E form-fill helpers ──────────────────────────────────────────────────
// Utilities for filling the NoduleRisk app form in Playwright tests.
// Selectors are tied to the id/class attributes in Calculator.tsx / NoduleCard.tsx.

import type { Page } from '@playwright/test';
import type { Nodule, DataSwitches } from '../../lib/models';
import type { PatientFixture } from '../fixtures/patients';

// ── Main entry point ──────────────────────────────────────────────────────

export async function fillForm(page: Page, fixture: PatientFixture): Promise<void> {
  // Enable data toggles FIRST — they reveal conditional nodule inputs
  if (fixture.ds.pet) {
    await page.locator('.tog').filter({ hasText: 'FDG-PET' }).click();
  }
  if (fixture.ds.vdt) {
    await page.locator('.tog').filter({ hasText: 'Two-point size measurements' }).click();
  }
  if (fixture.ds.enh) {
    await page.locator('.tog').filter({ hasText: 'CT enhancement' }).click();
  }
  if (fixture.ds.den) {
    await page.locator('.tog').filter({ hasText: 'Min focal density' }).click();
  }

  // Patient demographics
  const pt = fixture.patient;
  await page.locator('#age').fill(String(pt.age));
  await page.locator('#sex').selectOption(pt.sex as string);
  await page.locator('#smoker').selectOption(pt.smoker as string);
  if (pt.packyears > 0) {
    await page.locator('#packyears').fill(String(pt.packyears));
  }
  await page.locator('#priorcancer').selectOption(pt.priorcancer ? 'yes' : 'no');
  await page.locator('#familyhx').selectOption(pt.familyhx ? 'yes' : 'no');
  await page.locator('#emphysema').selectOption(pt.emphysema ? 'yes' : 'no');
  await page.locator('#ctx').selectOption(pt.ctx as string);
  await page.locator('#prior').fill(String(pt.prior));

  // Add nodules in order
  for (let i = 0; i < fixture.nodules.length; i++) {
    // Click the "+" (second .ncount-btn)
    await page.locator('.ncount-btn').nth(1).click();
    await page.locator(`#ncard-${i}`).waitFor({ state: 'visible' });
    await fillNodule(page, i, fixture.nodules[i], fixture.ds);
  }

  // Wait until the form is complete enough to show results
  await page.locator('[data-testid="mayo-pct"]').waitFor({ state: 'visible', timeout: 10_000 });
}

// ── Nodule card fill ───────────────────────────────────────────────────────

async function fillNodule(page: Page, index: number, nodule: Nodule, ds: DataSwitches): Promise<void> {
  const id = (field: string) => `#n${index}_${field}`;

  await page.locator(id('d')).fill(String(nodule.d));
  await page.locator(id('nt')).selectOption(nodule.nt);
  await page.locator(id('loc')).selectOption(nodule.loc);

  // Spiculation first — selecting 'yes' auto-syncs edges to 'spiculated'
  await page.locator(id('sp')).selectOption(nodule.sp ? 'yes' : 'no');
  if (!nodule.sp) {
    // Only explicitly set edges when not spiculated; spiculated is set by the sync
    await page.locator(id('edges')).selectOption(nodule.edges);
  }

  // Conditional PET inputs (toggle must be on)
  if (ds.pet) {
    await page.locator(id('pet')).selectOption(nodule.pet);
    await page.locator(id('suv')).fill(String(nodule.suv));
  }

  // Conditional VDT inputs
  if (ds.vdt) {
    await page.locator(id('s1')).fill(String(nodule.s1));
    await page.locator(id('s2')).fill(String(nodule.s2));
    if (nodule.d1) await page.locator(id('d1')).fill(nodule.d1);
    if (nodule.d2) await page.locator(id('d2')).fill(nodule.d2);
  }

  // Conditional density / enhancement inputs
  if (ds.den) {
    await page.locator(id('den')).selectOption(nodule.den);
  }
  if (ds.enh) {
    await page.locator(id('enh')).selectOption(nodule.enh);
  }
}

// ── Read displayed results ─────────────────────────────────────────────────

export async function readResults(page: Page) {
  // All values are read from the desktop table (viewport 1280×800 keeps it visible).
  // data-testid attributes are on the <p> elements in ResultsTable.tsx.
  // herder and vdt are absent from the DOM when their toggles are off.
  // Without an explicit timeout, textContent() waits the full 45s test
  // timeout before throwing — consuming the entire test budget. 1 500 ms is
  // more than enough because we've already confirmed mayo-pct is visible,
  // meaning all results have rendered in the same React paint.
  return {
    mayo:    await page.locator('[data-testid="mayo-pct"]').textContent() ?? '',
    brock:   await page.locator('[data-testid="brock-pct"]').textContent() ?? '',
    herder:  await page.locator('[data-testid="herder-pct"]').first().textContent({ timeout: 1500 }).catch(() => null),
    bimc:    await page.locator('[data-testid="bimc-pct"]').textContent() ?? '',
    vdt:     await page.locator('[data-testid="vdt-result"]').first().textContent({ timeout: 1500 }).catch(() => null),
    fleisch: await page.locator('[data-testid="fleisch-rec"]').textContent() ?? '',
  };
}

// ── Auto-select replication ─────────────────────────────────────────────────

import { scoreNodule } from '../../lib/models';

export function autoSelectIndex(fixture: PatientFixture): number {
  let best = 0;
  let bestScore = -1;
  fixture.nodules.forEach((nod, i) => {
    const s = scoreNodule(nod, fixture.patient, fixture.ds);
    if (s > bestScore) { bestScore = s; best = i; }
  });
  return best;
}
