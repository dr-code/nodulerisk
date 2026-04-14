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
}

export interface DataSwitches {
  pet: boolean;
  vdt: boolean;
  enh: boolean;
  den: boolean;
}

export interface PatientInputs {
  age: number;
  sex: 'male' | 'female';
  smoker: SmokerStatus;
  packyears: number;
  priorcancer: boolean;
  familyhx: boolean;
  emphysema: boolean;
  ctx: ClinicalContext;
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
  };
}

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
  if (!ds.vdt || !n.s1 || !n.s2 || n.s1 === n.s2) return null;
  const days = calcDaysBetween(n.d1, n.d2);
  if (!days) return null;
  const v = (days * Math.LN2) / (3 * Math.log(n.s2 / n.s1));
  return isFinite(v) && v !== 0 ? v : null;
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
  if (!ds.pet) return null;
  const sm = p.smoker !== 'never';
  const petPos = (n.pet && n.pet !== 'none') || n.suv > 2.5;
  return sig(
    -4.739 +
      0.068 * p.age +
      0.819 * (sm ? 1 : 0) +
      0.347 * (n.d / 10) +
      1.482 * (n.sp ? 1 : 0) +
      1.587 * (n.loc === 'upper' ? 1 : 0) +
      3.691 * (petPos ? 1 : 0),
  );
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
    if (p.priorcancer) w.push({ l: 'w', t: 'Original model excluded extrathoracic cancer <5 y; BTS guidelines permit inclusion' });
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
    if (n.nt !== 'solid' && V !== null && V < 900) w.push({ l: 'w', t: 'Subsolid nodules have longer VDT (3–5 y); malignant kinetics thresholds differ from solid nodules' });
  }

  return w;
}

// ── Auto-select scoring ────────────────────────────────────────────────────

export function scoreNodule(n: Nodule, p: PatientInputs, ds: DataSwitches): number {
  if (ds.pet && (n.suv > 0 || (n.pet && n.pet !== 'none'))) {
    return herderFor(n, p, ds) ?? bimcFor(n, p, ds);
  }
  return bimcFor(n, p, ds);
}
