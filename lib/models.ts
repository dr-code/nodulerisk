// ── Types ──────────────────────────────────────────────────────────────────

export type NoduleType = 'solid' | 'part_solid' | 'ground_glass';
export type EdgeKey = 'smooth' | 'min_lob' | 'lobulated' | 'frayed' | 'spiculated';
export type PetUptake = 'none' | 'faint' | 'moderate' | 'intense';
export type Location = 'lower' | 'middle' | 'upper';
export type DensityKey = 'lt_neg60' | 'neg60_neg30' | 'gt_neg30';
export type EnhancementKey = 'lt15' | '15_40' | 'gt40' | 'unknown';
export type SmokerStatus = 'never' | 'former' | 'current';
export type ClinicalContext = 'incidental' | 'screening' | 'biopsy';
export type RiskCategory = 'low' | 'intc' | 'high';
export type WarningLevel = 'e' | 'w';
export type VdtMethod = 'volumetric' | 'diametric' | 'spherical';

export interface Nodule {
  d: number;
  nt: NoduleType;
  loc: Location;
  sp: boolean;
  edges: EdgeKey;
  pet: PetUptake;
  suv: number;
  s1: number;
  s2: number;
  d1: string;
  d2: string;
  den: DensityKey;
  enh: EnhancementKey;
  vdtMethod: VdtMethod;
  v1: number;
  v2: number;
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
}

export interface DataSwitches {
  pet: boolean;
  vdt: boolean;
  enh: boolean;
  den: boolean;
}

export interface PatientInputs {
  age: number;
  sex: 'male' | 'female' | '';
  smoker: SmokerStatus | '';
  packyears: number;
  priorcancer: boolean;
  familyhx: boolean;
  emphysema: boolean;
  ctx: ClinicalContext | '';
  prior: number;
}

export interface Warning {
  l: WarningLevel;
  t: string;
}

export interface EdgeInfo {
  key: EdgeKey;
  label: string;
  lr: number;
  lrc: 'low' | 'intc' | 'hi';
  desc: string;
}

export interface LRChip {
  l: string;
  v: number;
  on: boolean;
}

export interface BimcLRResult {
  chips: LRChip[];
  product: number;
}

export interface FleischnerResult {
  rec: string;
  note: string;
  cat: RiskCategory;
}

export interface NextStep {
  priority: 'urgent' | 'standard' | 'info';
  model: string;
  action: string;
  rationale: string;
}

// ── Edge data ──────────────────────────────────────────────────────────────

export const EDGES: EdgeInfo[] = [
  {
    key: 'smooth',
    label: 'Smooth',
    lr: 0.293,
    lrc: 'low',
    desc: 'Perfectly regular, well-defined border with no projections or indentations. Strongly associated with benign etiology (granuloma, hamartoma). LR 0.293.',
  },
  {
    key: 'min_lob',
    label: 'Minimally lobulated',
    lr: 0.735,
    lrc: 'low',
    desc: 'Very subtle, shallow undulations. Barely perceptible scalloping with essentially regular contour. Still suggests benign process. LR 0.735.',
  },
  {
    key: 'lobulated',
    label: 'Deeply lobulated',
    lr: 1.888,
    lrc: 'intc',
    desc: 'Clear, prominent rounded bumps/scalloping (≥2 mm) reflecting uneven tumor growth. Intermediate concern. LR 1.888. (ESM dropdown = "Lobulated"; paper Fig. 2 = "deeply lobulated".)',
  },
  {
    key: 'frayed',
    label: 'Frayed',
    lr: 3.710,
    lrc: 'hi',
    desc: 'Irregular, ragged border with short angular projections; bristly appearance. Less organized than spiculation but more irregular than lobulation. LR 3.710.',
  },
  {
    key: 'spiculated',
    label: 'Spiculated',
    lr: 7.884,
    lrc: 'hi',
    desc: 'Thin, sharp, radiating needle-like projections from the nodule surface (corona radiata sign). Highly characteristic of invasive malignancy. LR 7.884. Automatically syncs with the Spiculation toggle.',
  },
];

// ── Likelihood ratio table ─────────────────────────────────────────────────

export const LR = {
  age: { lt40: 0.603, a40: 0.905, a50: 0.98, a60: 0.762, a70: 1.616, a80: 0.884 },
  smoke: { never: 1, lt40: 1.216, gte40: 3.7 },
  cancer: { no: 1, yes: 2.422 },
  size: { s10: 0.4, s15: 0.882, s20: 2.308, s25: 2.284, s30: 3.391 },
  loc: { lower: 0.889, middle: 1.271, upper: 1.044 },
  edges: { smooth: 0.293, min_lob: 0.735, lobulated: 1.888, frayed: 3.71, spiculated: 7.884 },
  vdt: { fast: 14.472, mid: 2.412, slow: 0.085 },
  den: { fat: 0.239, mid: 0.922, soft: 1.462 },
  enh: { low: 0.258, mid: 0.586, high: 5.004 },
  fdg: { none: 1, lt1: 0.100, mid: 0.606, high: 1.59 },
};

// ── Default nodule ─────────────────────────────────────────────────────────

export function defaultNodule(): Nodule {
  return {
    d: 10,
    nt: 'solid',
    loc: 'lower',
    sp: false,
    edges: 'min_lob',
    pet: 'none',
    suv: 0,
    s1: 0,
    s2: 10,
    d1: '',
    d2: '',
    den: 'gt_neg30',
    enh: 'lt15',
    vdtMethod: 'volumetric',
    v1: 0,
    v2: 0,
    x1: 0,
    y1: 0,
    z1: 0,
    x2: 0,
    y2: 0,
    z2: 0,
  };
}

export const VDT_METHODS: { key: VdtMethod; label: string; shortDesc: string; desc: string }[] = [
  {
    key: 'volumetric',
    label: 'Volumetric',
    shortDesc: 'Uses CT volumetry measurements (mm³)',
    desc: 'Calculates volume doubling time using user-entered nodule volume. Nodule volume should be measured by volumetry where possible. VDT = T \u00d7 ln(2) / ln(V\u2082/V\u2081)',
  },
  {
    key: 'diametric',
    label: 'Diametric',
    shortDesc: 'Estimates volume from three diameters (X \u00d7 Y \u00d7 Z)',
    desc: 'Estimates nodule volume using diameters in the X, Y and Z planes. Less accurate than volumetric method. Volume = X \u00d7 Y \u00d7 Z',
  },
  {
    key: 'spherical',
    label: 'Spherical',
    shortDesc: 'Estimates volume from a single diameter',
    desc: 'Used where nodule is relatively spherical in shape. Less accurate than volumetric method. Volume = (D\u00b3 \u00d7 \u03c0) / 6',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function sig(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function pct(p: number): string {
  return (p * 100).toFixed(1) + '%';
}

export function rcat(p: number, bts: boolean): RiskCategory {
  if (bts) return p < 0.10 ? 'low' : p < 0.70 ? 'intc' : 'high';
  return p < 0.05 ? 'low' : p < 0.65 ? 'intc' : 'high';
}

export function cc(cat: RiskCategory): string {
  return cat === 'high' ? 'hi' : cat === 'intc' ? 'intc' : 'low';
}

export function calcDaysBetween(d1: string, d2: string): number | null {
  if (!d1 || !d2) return null;
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  if (isNaN(t1) || isNaN(t2)) return null;
  const days = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  return days !== 0 ? days : null;
}

// ── Models ─────────────────────────────────────────────────────────────────

export function vdtFor(n: Nodule, ds: DataSwitches): number | null {
  if (!ds.vdt) return null;
  const days = calcDaysBetween(n.d1, n.d2);
  if (!days) return null;

  const method = n.vdtMethod ?? 'volumetric';
  let vol1: number, vol2: number;

  if (method === 'volumetric') {
    vol1 = n.v1;
    vol2 = n.v2;
  } else if (method === 'diametric') {
    vol1 = n.x1 * n.y1 * n.z1;
    vol2 = n.x2 * n.y2 * n.z2;
  } else {
    // spherical: V = π × D³ / 6
    vol1 = (Math.pow(n.s1, 3) * Math.PI) / 6;
    vol2 = (Math.pow(n.s2, 3) * Math.PI) / 6;
  }

  if (!vol1 || !vol2 || vol1 === vol2) return null;
  const vdt = (days * Math.LN2) / Math.log(vol2 / vol1);
  return isFinite(vdt) && vdt !== 0 ? vdt : null;
}

export function mayoFor(n: Nodule, p: PatientInputs): number {
  const sm = p.smoker !== 'never';
  return sig(
    -6.8272 +
      0.0391 * p.age +
      0.7917 * (sm ? 1 : 0) +
      0.1274 * n.d +
      1.0407 * (n.sp ? 1 : 0) +
      0.7838 * (n.loc === 'upper' ? 1 : 0) +
      1.3388 * (p.priorcancer ? 1 : 0),
  );
}

export function brockFor(n: Nodule, p: PatientInputs, noduleCount: number): number {
  const f = p.sex === 'female';
  return sig(
    -6.7892 +
      0.0391 * p.age +
      0.7917 * (f ? 1 : 0) +
      1.3388 * (p.familyhx ? 1 : 0) +
      0.7838 * (p.emphysema ? 1 : 0) +
      0.1274 * n.d +
      (n.nt === 'part_solid' ? 0.7838 : 0) +
      (n.nt === 'ground_glass' ? 1.0407 : 0) +
      0.7838 * (n.loc === 'upper' ? 1 : 0) +
      1.3388 * (n.sp ? 1 : 0) +
      0.2090 * Math.log(Math.max(noduleCount, 1)),
  );
}

export function herderFor(n: Nodule, p: PatientInputs, ds: DataSwitches): number | null {
  // Two-step Mayo+PET extension (Herder et al., Chest 2005).
  // Step 1: compute Mayo clinical probability.
  // Step 2: y = −4.739 + 3.691×mayo_prob + PET_term
  // PET graded terms: faint=+2.322, moderate=+4.617, intense=+4.771 (none=0)
  if (!ds.pet) return null;
  const mayo = mayoFor(n, p);
  const petTerm =
    n.pet === 'faint' ? 2.322
    : n.pet === 'moderate' ? 4.617
    : n.pet === 'intense' ? 4.771
    : 0;
  return sig(-4.739 + 3.691 * mayo + petTerm);
}

export function bimcLRsFor(n: Nodule, p: PatientInputs, ds: DataSwitches): BimcLRResult {
  const a = p.age;
  const ageLR =
    a < 40 ? LR.age.lt40
    : a < 50 ? LR.age.a40
    : a < 60 ? LR.age.a50
    : a < 70 ? LR.age.a60
    : a < 80 ? LR.age.a70
    : LR.age.a80;
  const aLabel =
    a < 40 ? '<40'
    : a < 50 ? '40–49'
    : a < 60 ? '50–59'
    : a < 70 ? '60–69'
    : a < 80 ? '70–79'
    : '80–89';

  const sm = p.smoker;
  const py = p.packyears;
  const smLR = sm === 'never' ? 1 : py >= 40 ? LR.smoke.gte40 : LR.smoke.lt40;

  const szLR =
    n.d <= 10 ? LR.size.s10
    : n.d <= 15 ? LR.size.s15
    : n.d <= 20 ? LR.size.s20
    : n.d <= 25 ? LR.size.s25
    : LR.size.s30;
  const szLabel =
    n.d <= 10 ? '4–10mm'
    : n.d <= 15 ? '11–15mm'
    : n.d <= 20 ? '16–20mm'
    : n.d <= 25 ? '21–25mm'
    : '26–30mm';

  const locLR =
    n.loc === 'upper' ? LR.loc.upper
    : n.loc === 'middle' ? LR.loc.middle
    : LR.loc.lower;

  const edgeLR = LR.edges[n.edges] ?? 1;
  const canLR = p.priorcancer ? LR.cancer.yes : LR.cancer.no;

  let vdtLR = 1;
  let vdtLabel = 'VDT: off';
  let vdtOn = false;
  if (ds.vdt) {
    const V = vdtFor(n, ds);
    if (V !== null && V > 0) {
      vdtOn = true;
      if (V <= 400) { vdtLR = LR.vdt.fast; vdtLabel = 'VDT ' + Math.round(V) + 'd'; }
      else if (V <= 900) { vdtLR = LR.vdt.mid; vdtLabel = 'VDT ' + Math.round(V) + 'd'; }
      else { vdtLR = LR.vdt.slow; vdtLabel = 'VDT ' + Math.round(V) + 'd'; }
    }
  }

  let denLR = 1;
  let denLabel = 'Density: off';
  const denOn = ds.den;
  if (ds.den) {
    denLR =
      n.den === 'lt_neg60' ? LR.den.fat
      : n.den === 'neg60_neg30' ? LR.den.mid
      : LR.den.soft;
    denLabel = { lt_neg60: '<−60HU', neg60_neg30: '−60–−30HU', gt_neg30: '>−30HU' }[n.den];
  }

  let enhLR = 1;
  let enhLabel = 'Enh: off';
  const enhOn = ds.enh;
  if (ds.enh) {
    enhLR =
      n.enh === 'lt15' ? LR.enh.low
      : n.enh === '15_40' ? LR.enh.mid
      : LR.enh.high;
    enhLabel = { lt15: '<15HU', '15_40': '15–40HU', gt40: '>40HU', unknown: '>40HU' }[n.enh];
  }

  let petLR = 1;
  let petLabel = 'PET: off';
  const petOn = ds.pet;
  if (ds.pet) {
    const suv = n.suv || 0;
    const pt = n.pet || 'none';
    petLR =
      pt === 'none' ? LR.fdg.none
      : suv < 1 ? LR.fdg.lt1
      : suv <= 2.5 ? LR.fdg.mid
      : LR.fdg.high;
    petLabel = pt === 'none' ? 'PET none' : 'SUV ' + (suv <= 2.5 ? '≤2.5' : '>2.5');
  }

  return {
    chips: [
      { l: 'Age: ' + aLabel, v: ageLR, on: true },
      { l: sm === 'never' ? 'Non-smoker' : py >= 40 ? '≥40 py' : '<40 py', v: smLR, on: true },
      { l: 'Size: ' + szLabel, v: szLR, on: true },
      { l: { lower: 'Lower', middle: 'Middle', upper: 'Upper' }[n.loc], v: locLR, on: true },
      {
        l: { smooth: 'Smooth', min_lob: 'Min-lob', lobulated: 'Deep-lob', frayed: 'Frayed', spiculated: 'Spiculated' }[n.edges] || '',
        v: edgeLR,
        on: true,
      },
      { l: 'Ca: ' + (p.priorcancer ? 'Yes' : 'No'), v: canLR, on: true },
      { l: vdtLabel, v: vdtLR, on: vdtOn },
      { l: denLabel, v: denLR, on: denOn },
      { l: enhLabel, v: enhLR, on: enhOn },
      { l: petLabel, v: petLR, on: petOn },
    ],
    product: ageLR * smLR * canLR * szLR * locLR * edgeLR * vdtLR * denLR * enhLR * petLR,
  };
}

export function bimcFor(n: Nodule, p: PatientInputs, ds: DataSwitches): number {
  const pr = p.prior;
  if (pr < 1 || pr > 99) return 0;
  const po = pr / (100 - pr);
  const c = bimcLRsFor(n, p, ds);
  return (po * c.product) / (po * c.product + 1);
}

export function fleischFor(n: Nodule, ds: DataSwitches): FleischnerResult {
  const { d, nt, suv } = n;
  if (nt === 'solid') {
    if (d < 6) return { rec: 'No routine follow-up', note: '<6 mm solid', cat: 'low' };
    if (d < 8) return { rec: 'CT 6–12 mo, then 18–24 mo', note: '6–8 mm solid', cat: 'intc' };
    return {
      rec: 'CT 3 mo / PET-CT / tissue sampling',
      note: ds.pet
        ? 'PET positive (SUV ' + (suv || 0).toFixed(1) + ') — tissue sampling'
        : 'Consider CT 3 mo, PET-CT, or tissue sampling',
      cat: 'high',
    };
  }
  if (nt === 'part_solid') {
    if (d < 6) return { rec: 'No routine follow-up', note: '<6 mm part-solid', cat: 'low' };
    return {
      rec: 'CT 3–6 mo; annual × 5 y if persistent',
      note: 'Solid component ≥6 mm → consider resection',
      cat: 'intc',
    };
  }
  // ground glass
  if (d < 6) return { rec: 'No routine follow-up', note: '<6 mm GGN', cat: 'low' };
  return { rec: 'CT 6–12 mo, then q2y × 5 y', note: 'Persistent GGN ≥6 mm', cat: 'intc' };
}

// ── Warnings ───────────────────────────────────────────────────────────────

export function getWarnings(
  model: string,
  n: Nodule,
  p: PatientInputs,
  ds: DataSwitches,
  noduleCount: number,
): Warning[] {
  const w: Warning[] = [];

  if (model === 'mayo') {
    if (n.d < 4) w.push({ l: 'e', t: 'Diameter <4 mm — below validated range (4–30 mm)' });
    if (n.d > 30) w.push({ l: 'e', t: 'Diameter >30 mm — lesion is a mass; TNM staging applies' });
    if (n.nt !== 'solid') w.push({ l: 'e', t: 'Derived from CXR data; not validated for subsolid nodules' });
    if (p.priorcancer) w.push({ l: 'w', t: 'Patients with prior cancer excluded from derivation cohort' });
    if (p.age < 40) w.push({ l: 'w', t: 'Age <40 — below typical derivation cohort range' });
    if (p.ctx === 'biopsy') w.push({ l: 'w', t: 'In biopsy-referred cohorts: AUC 0.70, poor calibration — likely underestimates (Heideman et al., CHEST Pulm 2024)' });
    if (p.ctx === 'screening') w.push({ l: 'w', t: 'Derived from incidentally detected nodules (23% prevalence); may overestimate in low-prevalence screening cohorts' });
  }

  if (model === 'brock') {
    if (n.d < 4) w.push({ l: 'e', t: 'Diameter <4 mm — below practical range for Brock model' });
    if (n.d > 30) w.push({ l: 'e', t: 'Diameter >30 mm — lesion is a mass; Brock not applicable' });
    if (p.age < 40) w.push({ l: 'e', t: 'Age <40 — PanCan enrolled ages 40–74 only' });
    if (p.age > 74) w.push({ l: 'e', t: 'Age >74 — above PanCan upper enrollment limit' });
    if (p.priorcancer) w.push({ l: 'w', t: 'Prior cancer: screening study excluded active malignancy' });
    if (p.ctx !== 'screening') w.push({ l: 'w', t: 'Derived from a screening population (5.5% prevalence); tends to underestimate probability in higher-prevalence clinical or biopsy-referred settings' });
    if (p.ctx === 'biopsy') w.push({ l: 'w', t: 'Biopsy-referred cohort: AUC 0.70, Brier 0.36 (worst calibrated model) — most likely to underestimate (Heideman et al., CHEST Pulm 2024)' });
  }

  if (model === 'herder') {
    if (n.d < 4) w.push({ l: 'e', t: 'Diameter <4 mm — below typical validated range' });
    if (n.d > 30) w.push({ l: 'e', t: 'Diameter >30 mm — lesion is a mass' });
    if (n.nt !== 'solid') w.push({ l: 'w', t: 'Derived primarily in solid nodules; limited validation in subsolid lesions' });
    if (p.priorcancer) w.push({ l: 'w', t: 'Original model excluded extrathoracic cancer <5 y; BTS and validation studies (Al-Ameri et al.) now permit inclusion — enter as yes' });
    if (n.pet === 'none') w.push({ l: 'w', t: 'FDG avidity = none (indiscernible from background): no PET term added. If scan truly negative, Herder result is driven entirely by Mayo clinical probability.' });
  }

  if (model === 'bimc') {
    if (n.d < 4) w.push({ l: 'e', t: 'Below validated range (4–30 mm solid nodules only)' });
    if (n.d > 30) w.push({ l: 'e', t: 'Above validated range (4–30 mm solid nodules only)' });
    if (n.nt !== 'solid') w.push({ l: 'e', t: 'BIMC validated for solid nodules only — subsolid inputs produce unvalidated results' });
    if (p.prior < 1 || p.prior > 99) w.push({ l: 'e', t: 'Prior probability must be 1–99% — BIMC result is 0 until a valid value is entered' });
    if (ds.enh) w.push({ l: 'w', t: 'Enhancement LR requires dedicated dynamic contrast CT, not incidental contrast' });
  }

  if (model === 'fleisch') {
    if (n.d > 30) w.push({ l: 'e', t: 'Diameter >30 mm is classified as a mass — Fleischner criteria do not apply' });
    if (noduleCount > 1) w.push({ l: 'w', t: 'Multiple nodules present; Fleischner recommends following the most suspicious lesion' });
  }

  if (model === 'vdt') {
    const V = vdtFor(n, ds);
    if (V !== null && V < 0) w.push({ l: 'e', t: 'Negative VDT — nodule is shrinking, suggesting benign/inflammatory process' });
    if (V !== null && V > 0 && V <= 400) w.push({ l: 'w', t: 'VDT <400 days: malignant kinetics. NELSON trial: 9.9% cancer probability (95% CI 6.9–14.1%). BTS: prompt diagnostic investigation.' });
    if (V !== null && V > 400 && V <= 600) w.push({ l: 'w', t: 'VDT 400–600 days: intermediate growth. NELSON trial: 4.0% cancer probability (95% CI 1.8–8.3%). Reassess at next interval.' });
    if (V !== null && V > 600) w.push({ l: 'w', t: 'VDT >600 days: slow growth, likely benign. NELSON trial: 0.8% cancer probability (95% CI 0.4–1.7%). BTS: consider discharge from surveillance.' });
    if (n.nt !== 'solid' && V !== null && V < 900) w.push({ l: 'w', t: 'Subsolid nodules have longer VDT (3–5 y); 400-day threshold applies to solid components. New solid growth in a GGN is independently concerning regardless of VDT.' });
  }

  return w;
}

// ── Next steps (management pathways) ──────────────────────────────────────

export function getNextSteps(
  mayo: number,
  brock: number,
  herder: number | null,
  vdt: number | null,
  fleischner: FleischnerResult,
): NextStep[] {
  const steps: NextStep[] = [];

  // ── Primary BTS pathway (Herder if PET available, else Brock) ──────────
  if (herder !== null) {
    if (herder >= 0.70) {
      steps.push({
        priority: 'urgent',
        model: 'Herder (BTS)',
        action: 'Surgical resection',
        rationale: `Herder ${pct(herder)} exceeds 70% BTS threshold. Refer to thoracic surgery. A prior negative biopsy does not exclude malignancy and requires reassessment.`,
      });
    } else if (herder >= 0.10) {
      steps.push({
        priority: 'standard',
        model: 'Herder (BTS)',
        action: 'Tissue biopsy',
        rationale: `Herder ${pct(herder)} falls in the 10–70% BTS intermediate range. Consider CT-guided biopsy, navigational bronchoscopy, or EBUS based on nodule location and local expertise.`,
      });
    } else {
      steps.push({
        priority: 'info',
        model: 'Herder (BTS)',
        action: 'CT surveillance',
        rationale: `Herder ${pct(herder)} is below 10% BTS low-risk threshold. Continue surveillance CT (12-month volumetry or 2-year 2D measurement). Reassess if growth detected.`,
      });
    }
  } else {
    // No PET data — Brock gates PET referral
    if (brock >= 0.10) {
      steps.push({
        priority: 'standard',
        model: 'Brock (BTS)',
        action: 'FDG-PET/CT recommended',
        rationale: `Brock ${pct(brock)} ≥10% — BTS guideline: obtain FDG-PET/CT before final management decision. Then apply Herder score to guide surveillance, biopsy, or surgery.`,
      });
    } else {
      steps.push({
        priority: 'info',
        model: 'Brock (BTS)',
        action: 'CT surveillance',
        rationale: `Brock ${pct(brock)} <10% — BTS low risk. CT surveillance program: 12-month volumetry (preferred) or 2-year 2D measurements. VDT >600 days supports discharge from surveillance.`,
      });
    }
  }

  // ── Mayo / ACCP parallel pathway ────────────────────────────────────────
  if (mayo >= 0.65) {
    steps.push({
      priority: 'urgent',
      model: 'Mayo (ACCP)',
      action: 'Surgical evaluation',
      rationale: `Mayo ${pct(mayo)} >65% — ACCP high risk. Refer for surgical resection if operatively fit. Obtain PET staging and pulmonary function assessment prior to resection.`,
    });
  } else if (mayo >= 0.05) {
    steps.push({
      priority: 'standard',
      model: 'Mayo (ACCP)',
      action: 'Functional imaging or biopsy',
      rationale: `Mayo ${pct(mayo)} intermediate (5–65%) — ACCP: consider FDG-PET/CT or tissue sampling. At the low end, imaging first; at the high end, biopsy or resection. Clinical judgment required.`,
    });
  } else {
    steps.push({
      priority: 'info',
      model: 'Mayo (ACCP)',
      action: 'Watchful waiting',
      rationale: `Mayo ${pct(mayo)} <5% — ACCP low risk. Watchful waiting is appropriate (Gould et al., Ann Intern Med 2003). Serial CT at 3 and 12 months can be considered for borderline cases.`,
    });
  }

  // ── VDT (objective growth data, when available) ─────────────────────────
  if (vdt !== null && vdt > 0) {
    if (vdt <= 400) {
      steps.push({
        priority: 'urgent',
        model: 'BTS VDT / NELSON trial',
        action: 'Prompt tissue evaluation',
        rationale: `VDT ${Math.round(vdt)} days (<400 d) — malignant kinetics. NELSON trial: 9.9% cancer probability (95% CI 6.9–14.1%). BTS: diagnostic investigation required (biopsy or resection). Significant growth ≥25% is independently sufficient.`,
      });
    } else if (vdt <= 600) {
      steps.push({
        priority: 'standard',
        model: 'BTS VDT / NELSON trial',
        action: 'Continue surveillance, consider PET',
        rationale: `VDT ${Math.round(vdt)} days (400–600 d) — intermediate growth rate. NELSON trial: 4.0% cancer probability (95% CI 1.8–8.3%). Reassess at next interval; consider PET-CT if not already performed.`,
      });
    } else {
      steps.push({
        priority: 'info',
        model: 'BTS VDT / NELSON trial',
        action: 'Consider discharge from surveillance',
        rationale: `VDT ${Math.round(vdt)} days (>600 d) — slow growth, likely benign. NELSON trial: 0.8% cancer probability (95% CI 0.4–1.7%). BTS: VDT >600 days supports discharge from surveillance program.`,
      });
    }
  }

  // ── Fleischner 2017 structural guidance ─────────────────────────────────
  steps.push({
    priority: fleischner.cat === 'high' ? 'urgent' : fleischner.cat === 'intc' ? 'standard' : 'info',
    model: 'Fleischner 2017',
    action: fleischner.rec,
    rationale: fleischner.note,
  });

  return steps;
}

// ── Auto-select scoring ────────────────────────────────────────────────────

export function scoreNodule(n: Nodule, p: PatientInputs, ds: DataSwitches): number {
  if (ds.pet && (n.suv > 0 || (n.pet && n.pet !== 'none'))) {
    return herderFor(n, p, ds) ?? bimcFor(n, p, ds);
  }
  return bimcFor(n, p, ds);
}
