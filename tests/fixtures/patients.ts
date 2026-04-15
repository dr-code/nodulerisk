// ── Patient fixtures for E2E validation ───────────────────────────────────
//
// 35 synthetic patients covering a wide range of clinical presentations.
// Used by both app.spec.ts (our app vs lib) and external.spec.ts (lib vs
// reference calculators).
//
// ── HERDER MANUAL REFERENCE (BTS calculator) ──────────────────────────────
// For patients with PET enabled, use the BTS calculator manually at:
// https://www.brit-thoracic.org.uk/clinical-resources/guidelines/pulmonary-nodules/pn-risk-calculator/
//
// Enter the six inputs below for each PET patient. Compare the BTS result
// against our app's Herder percentage.
//
// Patient  Age  EverSmoker  Size(mm)  Spiculation  UpperLobe  PET result
// -------  ---  ----------  --------  -----------  ---------  ----------
// P13      68   Yes         16        Yes          Yes        Intense
// P14      55   Yes         13        No           Yes        Moderate
// P15      72   No          10        No           No         None
// P16      60   Yes         20        No           Yes        Faint
// P17      50   Yes         8         No           No         None
// P18      63   Yes         18        Yes          Yes        Intense
// P19      45   No          12        No           No         Faint
// P20      77   Yes         24        Yes          Yes        Intense
// P27      65   Yes         22        Yes          Yes        Intense
// P28      58   Yes         13        No           Yes        None
// P29      73   Yes         28        No           Yes        Intense
// P32-N1   68   Yes         20        Yes          Yes        Intense
// P35-N1   55   Yes         15        Yes          Yes        Moderate
//
// Note: "EverSmoker" = current or former (not never). PET None = no FDG uptake.
// ──────────────────────────────────────────────────────────────────────────

import type { Nodule, PatientInputs, DataSwitches } from '../../lib/models';

export interface PatientFixture {
  id: string;
  label: string;
  patient: PatientInputs;
  nodules: Nodule[];
  ds: DataSwitches;
}

// ── Factory helpers ────────────────────────────────────────────────────────

const BASE_NOD: Nodule = {
  d: 10, nt: 'solid', loc: 'lower', sp: false, edges: 'min_lob',
  pet: 'none', suv: 0, s1: 0, s2: 0, d1: '', d2: '',
  den: 'gt_neg30', enh: 'lt15',
  vdtMethod: 'volumetric', v1: 0, v2: 0,
  x1: 0, y1: 0, z1: 0, x2: 0, y2: 0, z2: 0,
};

const BASE_PAT: PatientInputs = {
  age: 60, sex: 'male', smoker: 'never', packyears: 0,
  priorcancer: false, familyhx: false, emphysema: false,
  ctx: 'incidental', prior: 30,
};

const DS_OFF: DataSwitches = { pet: false, vdt: false, enh: false, den: false };
const DS_PET: DataSwitches = { pet: true,  vdt: false, enh: false, den: false };
const DS_VDT: DataSwitches = { pet: false, vdt: true,  enh: false, den: false };
const DS_PET_VDT: DataSwitches = { pet: true, vdt: true, enh: false, den: false };

function n(o: Partial<Nodule>): Nodule { return { ...BASE_NOD, ...o }; }
function p(o: Partial<PatientInputs>): PatientInputs { return { ...BASE_PAT, ...o }; }

// VDT nodule — d is set to s2 (current size) for all non-VDT model inputs.
// Uses spherical method because fixtures are defined with s1/s2 diameter values.
function vNod(base: Partial<Nodule>, s1: number, s2: number, d1: string, d2: string): Nodule {
  return n({ ...base, d: s2, s1, s2, d1, d2, vdtMethod: 'spherical' });
}

// ── Patient list ────────────────────────────────────────────────────────────
// Distribution:
//   Group 1  P01–P12  Single nodule, no PET, no VDT  (12 patients)
//   Group 2  P13–P20  Single nodule, PET enabled       (8 patients)
//   Group 3  P21–P26  Single nodule, VDT enabled       (6 patients)
//   Group 4  P27–P29  Single nodule, PET + VDT         (3 patients)
//   Group 5  P30–P33  Two nodules                      (4 patients)
//   Group 6  P34–P35  Three nodules                    (2 patients)

export const PATIENTS: PatientFixture[] = [

  // ── Group 1: Single nodule, no PET, no VDT ─────────────────────────────

  {
    id: 'P01',
    label: '45F · never · 8mm solid lower smooth · screening',
    patient: p({ age: 45, sex: 'female', smoker: 'never', ctx: 'screening', prior: 5 }),
    nodules: [n({ d: 8, nt: 'solid', loc: 'lower', sp: false, edges: 'smooth' })],
    ds: DS_OFF,
  },
  {
    id: 'P02',
    label: '62M · current 50py · 18mm solid upper spiculated · incidental',
    patient: p({ age: 62, sex: 'male', smoker: 'current', packyears: 50, ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 18, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated' })],
    ds: DS_OFF,
  },
  {
    id: 'P03',
    label: '55F · former 25py · 12mm part-solid upper lobulated · prior Ca · incidental',
    patient: p({ age: 55, sex: 'female', smoker: 'former', packyears: 25, priorcancer: true, ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 12, nt: 'part_solid', loc: 'upper', sp: false, edges: 'lobulated' })],
    ds: DS_OFF,
  },
  {
    id: 'P04',
    label: '70M · never · 6mm GGO lower min-lob · screening',
    patient: p({ age: 70, sex: 'male', smoker: 'never', ctx: 'screening', prior: 5 }),
    nodules: [n({ d: 6, nt: 'ground_glass', loc: 'lower', sp: false, edges: 'min_lob' })],
    ds: DS_OFF,
  },
  {
    id: 'P05',
    label: '48M · current 30py · 22mm solid middle frayed · emphysema · biopsy',
    patient: p({ age: 48, sex: 'male', smoker: 'current', packyears: 30, emphysema: true, ctx: 'biopsy', prior: 50 }),
    nodules: [n({ d: 22, nt: 'solid', loc: 'middle', sp: false, edges: 'frayed' })],
    ds: DS_OFF,
  },
  {
    id: 'P06',
    label: '67F · former 45py · 28mm solid upper spiculated · prior Ca · family hx · incidental',
    patient: p({ age: 67, sex: 'female', smoker: 'former', packyears: 45, priorcancer: true, familyhx: true, ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 28, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated' })],
    ds: DS_OFF,
  },
  {
    id: 'P07',
    label: '42F · never · 4mm solid lower smooth · screening',
    patient: p({ age: 42, sex: 'female', smoker: 'never', ctx: 'screening', prior: 5 }),
    nodules: [n({ d: 4, nt: 'solid', loc: 'lower', sp: false, edges: 'smooth' })],
    ds: DS_OFF,
  },
  {
    id: 'P08',
    label: '74M · current 60py · 15mm solid upper lobulated · emphysema · biopsy',
    patient: p({ age: 74, sex: 'male', smoker: 'current', packyears: 60, emphysema: true, ctx: 'biopsy', prior: 50 }),
    nodules: [n({ d: 15, nt: 'solid', loc: 'upper', sp: false, edges: 'lobulated' })],
    ds: DS_OFF,
  },
  {
    id: 'P09',
    label: '58M · former 20py · 9mm part-solid middle smooth · incidental',
    patient: p({ age: 58, sex: 'male', smoker: 'former', packyears: 20, ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 9, nt: 'part_solid', loc: 'middle', sp: false, edges: 'smooth' })],
    ds: DS_OFF,
  },
  {
    id: 'P10',
    label: '52F · never · 11mm GGO upper min-lob · family hx · incidental',
    patient: p({ age: 52, sex: 'female', smoker: 'never', familyhx: true, ctx: 'incidental', prior: 20 }),
    nodules: [n({ d: 11, nt: 'ground_glass', loc: 'upper', sp: false, edges: 'min_lob' })],
    ds: DS_OFF,
  },
  {
    id: 'P11',
    label: '65M · current 35py · 25mm solid upper frayed · prior Ca · biopsy',
    patient: p({ age: 65, sex: 'male', smoker: 'current', packyears: 35, priorcancer: true, ctx: 'biopsy', prior: 60 }),
    nodules: [n({ d: 25, nt: 'solid', loc: 'upper', sp: false, edges: 'frayed' })],
    ds: DS_OFF,
  },
  {
    id: 'P12',
    label: '38F · never · 7mm solid lower smooth · screening  [age <40 Brock warning]',
    patient: p({ age: 38, sex: 'female', smoker: 'never', ctx: 'screening', prior: 5 }),
    nodules: [n({ d: 7, nt: 'solid', loc: 'lower', sp: false, edges: 'smooth' })],
    ds: DS_OFF,
  },

  // ── Group 2: Single nodule, PET enabled ────────────────────────────────

  {
    id: 'P13',
    label: '68M · current 45py · 16mm solid upper spiculated · PET intense SUV 8.2 · incidental',
    patient: p({ age: 68, sex: 'male', smoker: 'current', packyears: 45, ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 16, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated', pet: 'intense', suv: 8.2 })],
    ds: DS_PET,
  },
  {
    id: 'P14',
    label: '55F · former 30py · 13mm solid upper lobulated · PET moderate SUV 2.8 · biopsy',
    patient: p({ age: 55, sex: 'female', smoker: 'former', packyears: 30, ctx: 'biopsy', prior: 50 }),
    nodules: [n({ d: 13, nt: 'solid', loc: 'upper', sp: false, edges: 'lobulated', pet: 'moderate', suv: 2.8 })],
    ds: DS_PET,
  },
  {
    id: 'P15',
    label: '72M · never · 10mm solid lower min-lob · PET none · incidental',
    patient: p({ age: 72, sex: 'male', smoker: 'never', ctx: 'incidental', prior: 30 }),
    nodules: [n({ d: 10, nt: 'solid', loc: 'lower', sp: false, edges: 'min_lob', pet: 'none', suv: 0 })],
    ds: DS_PET,
  },
  {
    id: 'P16',
    label: '60F · current 25py · 20mm part-solid upper frayed · PET faint SUV 1.5 · biopsy',
    patient: p({ age: 60, sex: 'female', smoker: 'current', packyears: 25, ctx: 'biopsy', prior: 50 }),
    nodules: [n({ d: 20, nt: 'part_solid', loc: 'upper', sp: false, edges: 'frayed', pet: 'faint', suv: 1.5 })],
    ds: DS_PET,
  },
  {
    id: 'P17',
    label: '50M · former 15py · 8mm solid middle smooth · PET none · screening',
    patient: p({ age: 50, sex: 'male', smoker: 'former', packyears: 15, ctx: 'screening', prior: 5 }),
    nodules: [n({ d: 8, nt: 'solid', loc: 'middle', sp: false, edges: 'smooth', pet: 'none', suv: 0 })],
    ds: DS_PET,
  },
  {
    id: 'P18',
    label: '63M · current 40py · 18mm solid upper spiculated · PET intense SUV 5.1 · biopsy',
    patient: p({ age: 63, sex: 'male', smoker: 'current', packyears: 40, ctx: 'biopsy', prior: 60 }),
    nodules: [n({ d: 18, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated', pet: 'intense', suv: 5.1 })],
    ds: DS_PET,
  },
  {
    id: 'P19',
    label: '45F · never · 12mm GGO lower smooth · PET faint SUV 1.2 · incidental',
    patient: p({ age: 45, sex: 'female', smoker: 'never', ctx: 'incidental', prior: 20 }),
    nodules: [n({ d: 12, nt: 'ground_glass', loc: 'lower', sp: false, edges: 'smooth', pet: 'faint', suv: 1.2 })],
    ds: DS_PET,
  },
  {
    id: 'P20',
    label: '77M · former 55py · 24mm solid upper spiculated · PET intense SUV 9.0 · biopsy  [age >74 Brock warning]',
    patient: p({ age: 77, sex: 'male', smoker: 'former', packyears: 55, ctx: 'biopsy', prior: 70 }),
    nodules: [n({ d: 24, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated', pet: 'intense', suv: 9.0 })],
    ds: DS_PET,
  },

  // ── Group 3: Single nodule, VDT enabled ────────────────────────────────
  // d is set to s2 (current size). VDT is computed from s1, s2, d1, d2.

  {
    id: 'P21',
    label: '56M · current 30py · 15→20mm solid upper spiculated · VDT fast (~146d) · incidental',
    // VDT ≈ (182 × ln2) / (3 × ln(20/15)) ≈ 146 days → malignant
    patient: p({ age: 56, sex: 'male', smoker: 'current', packyears: 30, ctx: 'incidental', prior: 30 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated' }, 15, 20, '2024-01-01', '2024-07-01')],
    ds: DS_VDT,
  },
  {
    id: 'P22',
    label: '64F · former 25py · 10→11mm solid lower smooth · VDT slow (~1769d) · screening',
    // VDT ≈ (731 × ln2) / (3 × ln(11/10)) ≈ 1769 days → benign
    patient: p({ age: 64, sex: 'female', smoker: 'former', packyears: 25, ctx: 'screening', prior: 5 }),
    nodules: [vNod({ nt: 'solid', loc: 'lower', sp: false, edges: 'smooth' }, 10, 11, '2023-01-01', '2025-01-01')],
    ds: DS_VDT,
  },
  {
    id: 'P23',
    label: '49M · never · 8→14mm solid upper lobulated · VDT very fast (~38d) · biopsy',
    // VDT ≈ (92 × ln2) / (3 × ln(14/8)) ≈ 38 days → malignant
    patient: p({ age: 49, sex: 'male', smoker: 'never', ctx: 'biopsy', prior: 50 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: false, edges: 'lobulated' }, 8, 14, '2024-06-01', '2024-09-01')],
    ds: DS_VDT,
  },
  {
    id: 'P24',
    label: '71F · current 50py · 20→22mm solid upper frayed · VDT intermediate (~667d) · incidental',
    // VDT ≈ (275 × ln2) / (3 × ln(22/20)) ≈ 667 days → intermediate
    patient: p({ age: 71, sex: 'female', smoker: 'current', packyears: 50, ctx: 'incidental', prior: 30 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: false, edges: 'frayed' }, 20, 22, '2024-03-01', '2024-12-01')],
    ds: DS_VDT,
  },
  {
    id: 'P25',
    label: '43M · former 10py · 6→7mm GGO lower smooth · VDT intermediate (~548d, GGO warning) · screening',
    // VDT ≈ (366 × ln2) / (3 × ln(7/6)) ≈ 548 days — subsolid warning applies
    patient: p({ age: 43, sex: 'male', smoker: 'former', packyears: 10, ctx: 'screening', prior: 5 }),
    nodules: [vNod({ nt: 'ground_glass', loc: 'lower', sp: false, edges: 'smooth' }, 6, 7, '2023-06-01', '2024-06-01')],
    ds: DS_VDT,
  },
  {
    id: 'P26',
    label: '67M · never · 12→16mm part-solid middle lobulated · VDT fast (~146d, subsolid warning) · incidental',
    // VDT ≈ (182 × ln2) / (3 × ln(16/12)) ≈ 146 days — subsolid warning applies
    patient: p({ age: 67, sex: 'male', smoker: 'never', ctx: 'incidental', prior: 30 }),
    nodules: [vNod({ nt: 'part_solid', loc: 'middle', sp: false, edges: 'lobulated' }, 12, 16, '2024-02-01', '2024-08-01')],
    ds: DS_VDT,
  },

  // ── Group 4: Single nodule, PET + VDT ─────────────────────────────────

  {
    id: 'P27',
    label: '65M · current 45py · 18→22mm solid upper spiculated · PET intense SUV 6.5 · VDT fast (~281d) · biopsy',
    // VDT ≈ (244 × ln2) / (3 × ln(22/18)) ≈ 281 days → malignant
    patient: p({ age: 65, sex: 'male', smoker: 'current', packyears: 45, ctx: 'biopsy', prior: 60 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated', pet: 'intense', suv: 6.5 }, 18, 22, '2024-01-15', '2024-09-15')],
    ds: DS_PET_VDT,
  },
  {
    id: 'P28',
    label: '58F · former 20py · 12→13mm solid upper min-lob · PET none · VDT slow (~1055d) · incidental',
    // VDT ≈ (365 × ln2) / (3 × ln(13/12)) ≈ 1055 days → benign
    patient: p({ age: 58, sex: 'female', smoker: 'former', packyears: 20, ctx: 'incidental', prior: 25 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: false, edges: 'min_lob', pet: 'none', suv: 0 }, 12, 13, '2024-04-01', '2025-04-01')],
    ds: DS_PET_VDT,
  },
  {
    id: 'P29',
    label: '73M · current 55py · 22→28mm solid upper frayed · PET intense SUV 7.2 · VDT fast (~148d) · biopsy',
    // VDT ≈ (153 × ln2) / (3 × ln(28/22)) ≈ 148 days → malignant
    patient: p({ age: 73, sex: 'male', smoker: 'current', packyears: 55, ctx: 'biopsy', prior: 70 }),
    nodules: [vNod({ nt: 'solid', loc: 'upper', sp: false, edges: 'frayed', pet: 'intense', suv: 7.2 }, 22, 28, '2024-05-01', '2024-10-01')],
    ds: DS_PET_VDT,
  },

  // ── Group 5: Two nodules ───────────────────────────────────────────────
  // Auto-select picks the highest-scoring nodule.

  {
    id: 'P30',
    label: '62M · current 35py · 2 nodules: 14mm solid upper spiculated + 8mm solid lower smooth · incidental',
    patient: p({ age: 62, sex: 'male', smoker: 'current', packyears: 35, ctx: 'incidental', prior: 30 }),
    nodules: [
      n({ d: 14, nt: 'solid', loc: 'upper', sp: true, edges: 'spiculated' }),
      n({ d: 8,  nt: 'solid', loc: 'lower', sp: false, edges: 'smooth' }),
    ],
    ds: DS_OFF,
  },
  {
    id: 'P31',
    label: '55F · former 20py · 2 nodules: 10mm GGO upper min-lob + 6mm solid middle smooth · family hx · screening',
    patient: p({ age: 55, sex: 'female', smoker: 'former', packyears: 20, familyhx: true, ctx: 'screening', prior: 5 }),
    nodules: [
      n({ d: 10, nt: 'ground_glass', loc: 'upper', sp: false, edges: 'min_lob' }),
      n({ d: 6,  nt: 'solid',        loc: 'middle', sp: false, edges: 'smooth' }),
    ],
    ds: DS_OFF,
  },
  {
    id: 'P32',
    label: '68M · current 50py · PET · 2 nodules: 20mm solid upper spiculated intense + 12mm solid lower smooth none · biopsy',
    patient: p({ age: 68, sex: 'male', smoker: 'current', packyears: 50, ctx: 'biopsy', prior: 60 }),
    nodules: [
      n({ d: 20, nt: 'solid', loc: 'upper', sp: true,  edges: 'spiculated', pet: 'intense', suv: 5.5 }),
      n({ d: 12, nt: 'solid', loc: 'lower', sp: false, edges: 'smooth',     pet: 'none',   suv: 0   }),
    ],
    ds: DS_PET,
  },
  {
    id: 'P33',
    label: '48F · never · 2 nodules: 12mm part-solid upper lobulated + 9mm solid lower min-lob · incidental',
    patient: p({ age: 48, sex: 'female', smoker: 'never', ctx: 'incidental', prior: 20 }),
    nodules: [
      n({ d: 12, nt: 'part_solid', loc: 'upper', sp: false, edges: 'lobulated' }),
      n({ d: 9,  nt: 'solid',      loc: 'lower', sp: false, edges: 'min_lob' }),
    ],
    ds: DS_OFF,
  },

  // ── Group 6: Three nodules ─────────────────────────────────────────────

  {
    id: 'P34',
    label: '70M · former 40py · VDT · emphysema · 3 nodules: 15→18mm solid upper frayed + 10mm solid middle lobulated + 6mm solid lower smooth · biopsy',
    // VDT for nodule 0: (184 × ln2) / (3 × ln(18/15)) ≈ 233 days → malignant
    patient: p({ age: 70, sex: 'male', smoker: 'former', packyears: 40, emphysema: true, ctx: 'biopsy', prior: 50 }),
    nodules: [
      vNod({ nt: 'solid', loc: 'upper',  sp: false, edges: 'frayed'   }, 15, 18, '2024-03-01', '2024-09-01'),
      n({   d: 10, nt: 'solid', loc: 'middle', sp: false, edges: 'lobulated' }),
      n({   d: 6,  nt: 'solid', loc: 'lower',  sp: false, edges: 'smooth'    }),
    ],
    ds: DS_VDT,
  },
  {
    id: 'P35',
    label: '55F · current 25py · PET · 3 nodules: 15mm part-solid upper spiculated moderate + 11mm solid upper min-lob none + 8mm solid lower smooth none · incidental',
    patient: p({ age: 55, sex: 'female', smoker: 'current', packyears: 25, ctx: 'incidental', prior: 30 }),
    nodules: [
      n({ d: 15, nt: 'part_solid', loc: 'upper', sp: true,  edges: 'spiculated', pet: 'moderate', suv: 2.8 }),
      n({ d: 11, nt: 'solid',      loc: 'upper', sp: false, edges: 'min_lob',    pet: 'none',     suv: 0   }),
      n({ d: 8,  nt: 'solid',      loc: 'lower', sp: false, edges: 'smooth',     pet: 'none',     suv: 0   }),
    ],
    ds: DS_PET,
  },
];

// ── External test subset ───────────────────────────────────────────────────
// Single-nodule solid patients within validated ranges — used by external.spec.ts.
// Chosen for Brock (age 40–74), Mayo, and BIMC (solid 4–30 mm).

export const EXTERNAL_SUBSET_IDS = ['P01', 'P02', 'P05', 'P08', 'P11', 'P15'] as const;

// VDT subset — patients with two-scan data
export const EXTERNAL_VDT_IDS = ['P21', 'P23', 'P24', 'P28'] as const;

export function getPatient(id: string): PatientFixture {
  const f = PATIENTS.find((p) => p.id === id);
  if (!f) throw new Error(`Patient ${id} not found`);
  return f;
}
