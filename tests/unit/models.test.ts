import { describe, it, expect } from 'vitest';
import {
  mayoFor,
  brockFor,
  herderFor,
  bimcFor,
  bimcLRsFor,
  fleischFor,
  vdtFor,
  getWarnings,
  defaultNodule,
  sig,
  pct,
  rcat,
  calcDaysBetween,
} from '@/lib/models';
import type { Nodule, PatientInputs, DataSwitches } from '@/lib/models';

// ── Shared fixtures ────────────────────────────────────────────────────────

const BASE_NODULE: Nodule = {
  d: 15,
  nt: 'solid',
  loc: 'upper',
  sp: true,
  edges: 'spiculated',
  pet: 'intense',
  suv: 6.0,
  s1: 10,
  s2: 15,
  d1: '2025-01-01',
  d2: '2025-07-01',
  den: 'gt_neg30',
  enh: 'lt15',
};

const BASE_PATIENT: PatientInputs = {
  age: 65,
  sex: 'male',
  smoker: 'current',
  packyears: 45,
  priorcancer: false,
  familyhx: false,
  emphysema: false,
  ctx: 'incidental',
  prior: 30,
};

const DS_ALL_ON: DataSwitches = { pet: true, vdt: true, enh: true, den: true };
const DS_ALL_OFF: DataSwitches = { pet: false, vdt: false, enh: false, den: false };

// ── sig / pct / rcat helpers ───────────────────────────────────────────────

describe('sig', () => {
  it('returns 0.5 for input 0', () => {
    expect(sig(0)).toBeCloseTo(0.5);
  });

  it('approaches 1 for large positive input', () => {
    expect(sig(10)).toBeGreaterThan(0.999);
  });

  it('approaches 0 for large negative input', () => {
    expect(sig(-10)).toBeLessThan(0.001);
  });
});

describe('pct', () => {
  it('formats probability as percentage string with 1 decimal', () => {
    expect(pct(0.123)).toBe('12.3%');
    expect(pct(1.0)).toBe('100.0%');
    expect(pct(0)).toBe('0.0%');
  });
});

describe('rcat', () => {
  it('returns low/intc/high using ACCP thresholds (bts=false)', () => {
    expect(rcat(0.04, false)).toBe('low');
    expect(rcat(0.05, false)).toBe('intc');   // 0.05 is exactly the low→intc boundary
    expect(rcat(0.649, false)).toBe('intc');
    expect(rcat(0.65, false)).toBe('high');   // 0.65 is exactly the intc→high boundary
  });

  it('returns low/intc/high using BTS thresholds (bts=true)', () => {
    expect(rcat(0.09, true)).toBe('low');
    expect(rcat(0.10, true)).toBe('intc');    // 0.10 is exactly the low→intc boundary
    expect(rcat(0.699, true)).toBe('intc');
    expect(rcat(0.70, true)).toBe('high');    // 0.70 is exactly the intc→high boundary
  });
});

describe('calcDaysBetween', () => {
  it('returns correct days between two dates', () => {
    expect(calcDaysBetween('2025-01-01', '2025-07-01')).toBe(181);
  });

  it('returns null when either date is empty', () => {
    expect(calcDaysBetween('', '2025-07-01')).toBeNull();
    expect(calcDaysBetween('2025-01-01', '')).toBeNull();
  });

  it('returns null when dates are equal', () => {
    expect(calcDaysBetween('2025-01-01', '2025-01-01')).toBeNull();
  });

  it('returns negative days when d2 is before d1', () => {
    const result = calcDaysBetween('2025-07-01', '2025-01-01');
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(0);
  });
});

// ── defaultNodule ──────────────────────────────────────────────────────────

describe('defaultNodule', () => {
  it('has enh set to lt15 (not unknown)', () => {
    expect(defaultNodule().enh).toBe('lt15');
  });

  it('has valid diameter in validated range', () => {
    const n = defaultNodule();
    expect(n.d).toBeGreaterThanOrEqual(4);
    expect(n.d).toBeLessThanOrEqual(30);
  });
});

// ── mayoFor ────────────────────────────────────────────────────────────────

describe('mayoFor', () => {
  it('returns a probability between 0 and 1', () => {
    const p = mayoFor(BASE_NODULE, BASE_PATIENT);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('increases probability with spiculation', () => {
    const withSp = mayoFor({ ...BASE_NODULE, sp: true }, BASE_PATIENT);
    const noSp = mayoFor({ ...BASE_NODULE, sp: false }, BASE_PATIENT);
    expect(withSp).toBeGreaterThan(noSp);
  });

  it('increases probability with upper lobe location', () => {
    const upper = mayoFor({ ...BASE_NODULE, loc: 'upper' }, BASE_PATIENT);
    const lower = mayoFor({ ...BASE_NODULE, loc: 'lower' }, BASE_PATIENT);
    expect(upper).toBeGreaterThan(lower);
  });

  it('increases probability with prior cancer', () => {
    const withCa = mayoFor(BASE_NODULE, { ...BASE_PATIENT, priorcancer: true });
    const noCa = mayoFor(BASE_NODULE, { ...BASE_PATIENT, priorcancer: false });
    expect(withCa).toBeGreaterThan(noCa);
  });

  it('increases probability with smoking history', () => {
    const smoker = mayoFor(BASE_NODULE, { ...BASE_PATIENT, smoker: 'current' });
    const never = mayoFor(BASE_NODULE, { ...BASE_PATIENT, smoker: 'never' });
    expect(smoker).toBeGreaterThan(never);
  });

  it('increases probability with larger diameter', () => {
    const large = mayoFor({ ...BASE_NODULE, d: 25 }, BASE_PATIENT);
    const small = mayoFor({ ...BASE_NODULE, d: 8 }, BASE_PATIENT);
    expect(large).toBeGreaterThan(small);
  });
});

// ── brockFor ───────────────────────────────────────────────────────────────

describe('brockFor', () => {
  it('returns a probability between 0 and 1', () => {
    const p = brockFor(BASE_NODULE, BASE_PATIENT, 1);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('increases probability for female sex', () => {
    const female = brockFor(BASE_NODULE, { ...BASE_PATIENT, sex: 'female' }, 1);
    const male = brockFor(BASE_NODULE, { ...BASE_PATIENT, sex: 'male' }, 1);
    expect(female).toBeGreaterThan(male);
  });

  it('increases probability with family history of lung cancer', () => {
    const fhx = brockFor(BASE_NODULE, { ...BASE_PATIENT, familyhx: true }, 1);
    const noFhx = brockFor(BASE_NODULE, { ...BASE_PATIENT, familyhx: false }, 1);
    expect(fhx).toBeGreaterThan(noFhx);
  });

  it('increases probability with emphysema', () => {
    const emph = brockFor(BASE_NODULE, { ...BASE_PATIENT, emphysema: true }, 1);
    const noEmph = brockFor(BASE_NODULE, { ...BASE_PATIENT, emphysema: false }, 1);
    expect(emph).toBeGreaterThan(noEmph);
  });

  it('increases probability for ground glass composition', () => {
    const gg = brockFor({ ...BASE_NODULE, nt: 'ground_glass' }, BASE_PATIENT, 1);
    const solid = brockFor({ ...BASE_NODULE, nt: 'solid' }, BASE_PATIENT, 1);
    expect(gg).toBeGreaterThan(solid);
  });

  it('increases probability with higher nodule count', () => {
    const multi = brockFor(BASE_NODULE, BASE_PATIENT, 4);
    const single = brockFor(BASE_NODULE, BASE_PATIENT, 1);
    expect(multi).toBeGreaterThan(single);
  });
});

// ── herderFor ─────────────────────────────────────────────────────────────

describe('herderFor', () => {
  it('returns null when PET is disabled', () => {
    expect(herderFor(BASE_NODULE, BASE_PATIENT, DS_ALL_OFF)).toBeNull();
  });

  it('returns a probability between 0 and 1 when PET is enabled', () => {
    const p = herderFor(BASE_NODULE, BASE_PATIENT, DS_ALL_ON);
    expect(p).not.toBeNull();
    expect(p!).toBeGreaterThan(0);
    expect(p!).toBeLessThan(1);
  });

  it('increases probability with positive PET uptake', () => {
    const positive = herderFor({ ...BASE_NODULE, pet: 'intense', suv: 6.0 }, BASE_PATIENT, DS_ALL_ON);
    const negative = herderFor({ ...BASE_NODULE, pet: 'none', suv: 0 }, BASE_PATIENT, DS_ALL_ON);
    expect(positive!).toBeGreaterThan(negative!);
  });

  it('treats SUV > 2.5 as PET positive', () => {
    const highSuv = herderFor({ ...BASE_NODULE, pet: 'none', suv: 3.0 }, BASE_PATIENT, DS_ALL_ON);
    const lowSuv = herderFor({ ...BASE_NODULE, pet: 'none', suv: 1.0 }, BASE_PATIENT, DS_ALL_ON);
    expect(highSuv!).toBeGreaterThan(lowSuv!);
  });
});

// ── bimcFor ────────────────────────────────────────────────────────────────

describe('bimcFor', () => {
  it('returns 0 when prior is less than 1', () => {
    expect(bimcFor(BASE_NODULE, { ...BASE_PATIENT, prior: 0 }, DS_ALL_OFF)).toBe(0);
  });

  it('returns 0 when prior is greater than 99', () => {
    expect(bimcFor(BASE_NODULE, { ...BASE_PATIENT, prior: 100 }, DS_ALL_OFF)).toBe(0);
  });

  it('returns a probability between 0 and 1 for valid prior', () => {
    const p = bimcFor(BASE_NODULE, BASE_PATIENT, DS_ALL_OFF);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it('increases with higher prior probability', () => {
    const hi = bimcFor(BASE_NODULE, { ...BASE_PATIENT, prior: 60 }, DS_ALL_OFF);
    const lo = bimcFor(BASE_NODULE, { ...BASE_PATIENT, prior: 10 }, DS_ALL_OFF);
    expect(hi).toBeGreaterThan(lo);
  });

  it('uses enh LR when enh is enabled', () => {
    const withEnh = bimcFor({ ...BASE_NODULE, enh: 'gt40' }, BASE_PATIENT, { ...DS_ALL_OFF, enh: true });
    const noEnh = bimcFor({ ...BASE_NODULE, enh: 'lt15' }, BASE_PATIENT, { ...DS_ALL_OFF, enh: false });
    expect(withEnh).toBeGreaterThan(noEnh);
  });

  it('does not apply enh LR when enh toggle is off', () => {
    const enhOff = bimcFor({ ...BASE_NODULE, enh: 'gt40' }, BASE_PATIENT, { ...DS_ALL_OFF, enh: false });
    const enhOn = bimcFor({ ...BASE_NODULE, enh: 'gt40' }, BASE_PATIENT, { ...DS_ALL_OFF, enh: true });
    expect(enhOn).toBeGreaterThan(enhOff);
  });
});

describe('bimcLRsFor — enh unknown guard', () => {
  it('uses lt15 LR (0.258) for enh=lt15 when enhancement enabled', () => {
    const result = bimcLRsFor(
      { ...BASE_NODULE, enh: 'lt15' },
      BASE_PATIENT,
      { ...DS_ALL_OFF, enh: true },
    );
    // When enh=lt15, chip label is '<15HU'; LR should be 0.258 (suppressing, not amplifying)
    const enhChip = result.chips.find((c) => c.l === '<15HU');
    expect(enhChip).toBeDefined();
    expect(enhChip!.v).toBeCloseTo(0.258);
    expect(enhChip!.on).toBe(true);
  });

  it('high-malignancy enh LR (5.004) when enh=gt40', () => {
    const result = bimcLRsFor(
      { ...BASE_NODULE, enh: 'gt40' },
      BASE_PATIENT,
      { ...DS_ALL_OFF, enh: true },
    );
    const enhChip = result.chips.find((c) => c.l === '>40HU');
    expect(enhChip).toBeDefined();
    expect(enhChip!.v).toBeCloseTo(5.004);
  });
});

// ── fleischFor ────────────────────────────────────────────────────────────

describe('fleischFor', () => {
  it('solid <6 mm → no routine follow-up (low)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'solid', d: 5 }, DS_ALL_OFF);
    expect(r.cat).toBe('low');
    expect(r.rec).toMatch(/No routine follow-up/);
  });

  it('solid 6–8 mm → CT surveillance (intc)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'solid', d: 7 }, DS_ALL_OFF);
    expect(r.cat).toBe('intc');
  });

  it('solid >8 mm → tissue sampling (high)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'solid', d: 9 }, DS_ALL_OFF);
    expect(r.cat).toBe('high');
  });

  it('part-solid <6 mm → no routine follow-up (low)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'part_solid', d: 5 }, DS_ALL_OFF);
    expect(r.cat).toBe('low');
  });

  it('part-solid ≥6 mm → surveillance (intc)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'part_solid', d: 6 }, DS_ALL_OFF);
    expect(r.cat).toBe('intc');
  });

  it('ground glass <6 mm → no routine follow-up (low)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'ground_glass', d: 5 }, DS_ALL_OFF);
    expect(r.cat).toBe('low');
  });

  it('ground glass ≥6 mm → surveillance (intc)', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'ground_glass', d: 6 }, DS_ALL_OFF);
    expect(r.cat).toBe('intc');
  });

  it('solid >30 mm → still returns high cat', () => {
    const r = fleischFor({ ...BASE_NODULE, nt: 'solid', d: 35 }, DS_ALL_OFF);
    expect(r.cat).toBe('high');
  });
});

// ── vdtFor ────────────────────────────────────────────────────────────────

describe('vdtFor', () => {
  it('returns null when vdt toggle is off', () => {
    expect(vdtFor(BASE_NODULE, DS_ALL_OFF)).toBeNull();
  });

  it('returns null when s1 is 0', () => {
    expect(vdtFor({ ...BASE_NODULE, s1: 0 }, DS_ALL_ON)).toBeNull();
  });

  it('returns null when s1 equals s2', () => {
    expect(vdtFor({ ...BASE_NODULE, s1: 15, s2: 15 }, DS_ALL_ON)).toBeNull();
  });

  it('returns a positive number for a growing nodule', () => {
    const v = vdtFor(BASE_NODULE, DS_ALL_ON); // s1=10, s2=15, 181 days
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(0);
  });

  it('fast VDT (≤400d) for rapid growth', () => {
    // Large diameter jump over short interval → fast VDT
    const v = vdtFor(
      { ...BASE_NODULE, s1: 5, s2: 20, d1: '2025-01-01', d2: '2025-04-01' },
      DS_ALL_ON,
    );
    expect(v).not.toBeNull();
    expect(v!).toBeLessThanOrEqual(400);
  });

  it('slow VDT (>900d) for slow growth', () => {
    // Very small diameter change over a year → slow VDT well above 900d
    // VDT = (365 * ln2) / (3 * ln(10.5/10)) ≈ 1730 days
    const v = vdtFor(
      { ...BASE_NODULE, s1: 10, s2: 10.5, d1: '2024-01-01', d2: '2025-01-01' },
      DS_ALL_ON,
    );
    expect(v).not.toBeNull();
    expect(v!).toBeGreaterThan(900);
  });
});

// ── getWarnings ───────────────────────────────────────────────────────────

describe('getWarnings — mayo', () => {
  it('errors on diameter <4 mm', () => {
    const w = getWarnings('mayo', { ...BASE_NODULE, d: 3 }, BASE_PATIENT, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('<4 mm'))).toBe(true);
  });

  it('errors on diameter >30 mm', () => {
    const w = getWarnings('mayo', { ...BASE_NODULE, d: 31 }, BASE_PATIENT, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('>30 mm'))).toBe(true);
  });

  it('errors on non-solid nodule type', () => {
    const w = getWarnings('mayo', { ...BASE_NODULE, nt: 'ground_glass' }, BASE_PATIENT, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('subsolid'))).toBe(true);
  });

  it('warns in biopsy context', () => {
    const w = getWarnings('mayo', BASE_NODULE, { ...BASE_PATIENT, ctx: 'biopsy' }, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'w' && x.t.includes('biopsy'))).toBe(true);
  });
});

describe('getWarnings — brock', () => {
  it('errors on age <40', () => {
    const w = getWarnings('brock', BASE_NODULE, { ...BASE_PATIENT, age: 39 }, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('Age <40'))).toBe(true);
  });

  it('errors on age >74', () => {
    const w = getWarnings('brock', BASE_NODULE, { ...BASE_PATIENT, age: 75 }, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('Age >74'))).toBe(true);
  });
});

describe('getWarnings — bimc', () => {
  it('errors on non-solid nodule', () => {
    const w = getWarnings('bimc', { ...BASE_NODULE, nt: 'part_solid' }, BASE_PATIENT, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('solid nodules only'))).toBe(true);
  });

  it('warns when enhancement LR is active (dynamic CT caveat)', () => {
    const w = getWarnings('bimc', BASE_NODULE, BASE_PATIENT, { ...DS_ALL_OFF, enh: true }, 1);
    expect(w.some((x) => x.l === 'w' && x.t.includes('Enhancement'))).toBe(true);
  });
});

describe('getWarnings — fleisch', () => {
  it('errors on diameter >30 mm', () => {
    const w = getWarnings('fleisch', { ...BASE_NODULE, d: 31 }, BASE_PATIENT, DS_ALL_OFF, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('mass'))).toBe(true);
  });

  it('warns on multiple nodules', () => {
    const w = getWarnings('fleisch', BASE_NODULE, BASE_PATIENT, DS_ALL_OFF, 3);
    expect(w.some((x) => x.l === 'w' && x.t.includes('Multiple nodules'))).toBe(true);
  });
});

describe('getWarnings — vdt', () => {
  it('errors on negative VDT (shrinking nodule)', () => {
    const shrinkingNodule: Nodule = {
      ...BASE_NODULE,
      s1: 20,
      s2: 10,
      d1: '2025-01-01',
      d2: '2025-07-01',
    };
    const w = getWarnings('vdt', shrinkingNodule, BASE_PATIENT, DS_ALL_ON, 1);
    expect(w.some((x) => x.l === 'e' && x.t.includes('shrinking'))).toBe(true);
  });
});
