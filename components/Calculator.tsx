'use client';

import { useState, useCallback } from 'react';
import NoduleCard from '@/components/NoduleCard';
import EdgeTooltip from '@/components/EdgeTooltip';
import ResultsTable from '@/components/ResultsTable';
import {
  defaultNodule,
  mayoFor,
  brockFor,
  herderFor,
  bimcFor,
  bimcLRsFor,
  fleischFor,
  vdtFor,
  getWarnings,
  scoreNodule,
  rcat,
} from '@/lib/models';
import type {
  Nodule,
  DataSwitches,
  PatientInputs,
  EdgeKey,
  SmokerStatus,
  ClinicalContext,
} from '@/lib/models';

// ── Initial state ──────────────────────────────────────────────────────────

const INITIAL_NODULES: Nodule[] = [
  {
    d: 21, nt: 'solid', loc: 'lower', sp: false, edges: 'lobulated',
    pet: 'intense', suv: 6.4, s1: 10, s2: 21, d1: '2025-07-01', d2: '2026-04-01',
    den: 'gt_neg30', enh: 'lt15',
  },
  {
    d: 14, nt: 'solid', loc: 'lower', sp: false, edges: 'lobulated',
    pet: 'faint', suv: 2.1, s1: 0, s2: 14, d1: '2025-07-01', d2: '2026-04-01',
    den: 'gt_neg30', enh: 'lt15',
  },
];

const INITIAL_DS: DataSwitches = { pet: true, vdt: true, enh: false, den: false };

const INITIAL_PATIENT: PatientInputs = {
  age: 60, sex: 'female', smoker: 'never', packyears: 0,
  priorcancer: false, familyhx: false, emphysema: false,
  ctx: 'incidental', prior: 30,
};

// ── Blank state (used by Clear button) ────────────────────────────────────

const BLANK_NODULES: Nodule[] = [];
const BLANK_DS: DataSwitches = { pet: false, vdt: false, enh: false, den: false };
const BLANK_PATIENT: PatientInputs = {
  age: 0, sex: '', smoker: '', packyears: 0,
  priorcancer: false, familyhx: false, emphysema: false,
  ctx: '', prior: 30,
};

// ── Auto-select logic ──────────────────────────────────────────────────────

function autoSelect(nodules: Nodule[], patient: PatientInputs, ds: DataSwitches): number {
  let best = 0;
  let bestScore = -1;
  nodules.forEach((n, i) => {
    const s = scoreNodule(n, patient, ds);
    if (s > bestScore) { bestScore = s; best = i; }
  });
  return best;
}

// ── Edge tooltip state ─────────────────────────────────────────────────────

interface TTState {
  noduleIndex: number;
  anchorRect: DOMRect;
  activeBtnEl: HTMLButtonElement;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [ds, setDs] = useState<DataSwitches>(INITIAL_DS);
  const [nodules, setNodules] = useState<Nodule[]>(INITIAL_NODULES);
  const [patient, setPatient] = useState<PatientInputs>(INITIAL_PATIENT);
  const [selIdx, setSelIdx] = useState<number>(0);
  const [manualSel, setManualSel] = useState<boolean>(false);
  const [tt, setTT] = useState<TTState | null>(null);

  // Derive selIdx when not manual
  const effectiveSelIdx = manualSel ? selIdx : autoSelect(nodules, patient, ds);

  // ── Callbacks ────────────────────────────────────────────────────────────

  function toggleData(k: keyof DataSwitches) {
    setDs((prev) => ({ ...prev, [k]: !prev[k] }));
    closeTT();
  }

  function changeCount(delta: number) {
    setNodules((prev) => {
      const n = prev.length + delta;
      if (n < 0 || n > 6) return prev;
      if (delta > 0) return [...prev, defaultNodule()];
      return prev.slice(0, -1);
    });
    closeTT();
  }

  const handleNoduleChange = useCallback(
    (index: number, key: keyof Nodule, value: Nodule[keyof Nodule]) => {
      setNodules((prev) => {
        const next = prev.map((n, i) => (i === index ? { ...n, [key]: value } : n));

        // Bidirectional spiculation-edge sync
        if (key === 'sp') {
          if (value === true) {
            next[index] = { ...next[index], edges: 'spiculated' };
          } else if (next[index].edges === 'spiculated') {
            next[index] = { ...next[index], edges: 'lobulated' };
          }
        } else if (key === 'edges') {
          const edgeVal = value as EdgeKey;
          next[index] = { ...next[index], sp: edgeVal === 'spiculated' };
        }

        return next;
      });
    },
    [],
  );

  function handleNoduleSelect(index: number) {
    if (nodules.length === 1) return;
    setSelIdx(index);
    setManualSel(true);
  }

  function resetAuto() {
    setManualSel(false);
  }

  function resetForm() {
    setDs(BLANK_DS);
    setNodules(BLANK_NODULES);
    setPatient(BLANK_PATIENT);
    setSelIdx(0);
    setManualSel(false);
    closeTT();
  }

  function openTT(noduleIndex: number, btn: HTMLButtonElement) {
    // Toggle: if already open for the same nodule, close it
    if (tt && tt.noduleIndex === noduleIndex) {
      closeTT();
      return;
    }
    if (tt) tt.activeBtnEl.classList.remove('active');
    btn.classList.add('active');
    setTT({ noduleIndex, anchorRect: btn.getBoundingClientRect(), activeBtnEl: btn });
  }

  function closeTT() {
    if (tt) tt.activeBtnEl.classList.remove('active');
    setTT(null);
  }

  function handleEdgeSelect(noduleIndex: number, edge: EdgeKey) {
    handleNoduleChange(noduleIndex, 'edges', edge);
    // Update anchorRect in case tooltip needs to refresh, keep it open
    setTT((prev) => (prev ? { ...prev, noduleIndex } : null));
  }

  // ── Patient input helpers ─────────────────────────────────────────────

  function setPatientField<K extends keyof PatientInputs>(key: K, value: PatientInputs[K]) {
    setPatient((prev) => ({ ...prev, [key]: value }));
  }

  // ── Form readiness — required before running any model ───────────────

  const formReady =
    nodules.length > 0 &&
    patient.sex !== '' &&
    patient.smoker !== '' &&
    patient.ctx !== '';

  // ── Computed results for selected nodule (only when form is complete) ─

  const activeNodule = nodules[effectiveSelIdx] ?? nodules[0];
  const M = formReady ? mayoFor(activeNodule, patient) : 0;
  const B = formReady ? brockFor(activeNodule, patient, nodules.length) : 0;
  const H = formReady ? herderFor(activeNodule, patient, ds) : null;
  const I = formReady ? bimcFor(activeNodule, patient, ds) : 0;
  const C = formReady ? bimcLRsFor(activeNodule, patient, ds) : { chips: [], product: 1 };
  const V = formReady ? vdtFor(activeNodule, ds) : null;
  const F = formReady ? fleischFor(activeNodule, ds) : { rec: '—', note: '—', cat: 'low' as const };

  const allWarnings = formReady ? {
    mayo: getWarnings('mayo', activeNodule, patient, ds, nodules.length),
    brock: getWarnings('brock', activeNodule, patient, ds, nodules.length),
    herder: getWarnings('herder', activeNodule, patient, ds, nodules.length),
    bimc: getWarnings('bimc', activeNodule, patient, ds, nodules.length),
    fleisch: getWarnings('fleisch', activeNodule, patient, ds, nodules.length),
    vdt: getWarnings('vdt', activeNodule, patient, ds, nodules.length),
  } : { mayo: [], brock: [], herder: [], bimc: [], fleisch: [], vdt: [] };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <header>
        <div className="hdr-left">
          <h1>Pulmonary Nodule Malignancy Risk</h1>
          <p>Mayo · Brock · Herder · BIMC · Fleischner 2017 · BTS VDT &nbsp;·&nbsp; For qualified clinician use only</p>
        </div>
        <button className="clear-btn" onClick={resetForm}>Clear</button>
      </header>

      {tt && (
        <EdgeTooltip
          noduleIndex={tt.noduleIndex}
          currentEdge={nodules[tt.noduleIndex]?.edges ?? 'min_lob'}
          anchorRect={tt.anchorRect}
          onSelect={handleEdgeSelect}
          onClose={closeTT}
        />
      )}

      <div className="main">
        {/* ── Left panel: inputs ── */}
        <div className="inp">

          {/* Available data toggles */}
          <div className="slbl">Available data</div>
          <div className="tog-grid">
            {(
              [
                ['pet', 'FDG-PET / PET-CT', 'Enables Herder · activates BIMC PET LR'],
                ['vdt', 'Two-point size measurements', 'Enables BTS VDT · activates BIMC VDT LR'],
                ['enh', 'CT enhancement (dynamic contrast CT)', 'Activates BIMC enhancement LR per nodule'],
                ['den', 'Min focal density (HU)', 'Activates BIMC density LR per nodule'],
              ] as const
            ).map(([key, title, sub]) => (
              <div
                key={key}
                className={'tog' + (ds[key] ? ' on' : '')}
                onClick={() => toggleData(key)}
              >
                <div className="tog-lbl">
                  <strong>{title}</strong>
                  <span>{sub}</span>
                </div>
                <div className="sw" />
              </div>
            ))}
          </div>

          {/* Patient demographics */}
          <div className="slbl">Patient demographics</div>
          <div className="fg">
            <div className="fld">
              <label>Age (years)</label>
              <input
                type="number"
                id="age"
                value={patient.age}
                min={18}
                max={99}
                onChange={(e) => setPatientField('age', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="fld">
              <label>Sex</label>
              <select
                id="sex"
                value={patient.sex}
                onChange={(e) => setPatientField('sex', e.target.value as PatientInputs['sex'])}
              >
                <option value="" disabled>— select —</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>
          <div className="fg" style={{ marginTop: 7 }}>
            <div className="fld">
              <label>Smoking status</label>
              <select
                id="smoker"
                value={patient.smoker}
                onChange={(e) => setPatientField('smoker', e.target.value as SmokerStatus | '')}
              >
                <option value="" disabled>— select —</option>
                <option value="never">Never smoker</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
              </select>
            </div>
            <div className="fld">
              <label>Pack-years</label>
              <input
                type="number"
                id="packyears"
                value={patient.packyears}
                min={0}
                onChange={(e) => setPatientField('packyears', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="fg c3" style={{ marginTop: 7 }}>
            <div className="fld">
              <label>Prior cancer</label>
              <select
                id="priorcancer"
                value={patient.priorcancer ? 'yes' : 'no'}
                onChange={(e) => setPatientField('priorcancer', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="fld">
              <label>Family hx lung Ca</label>
              <select
                id="familyhx"
                value={patient.familyhx ? 'yes' : 'no'}
                onChange={(e) => setPatientField('familyhx', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div className="fld">
              <label>Emphysema</label>
              <select
                id="emphysema"
                value={patient.emphysema ? 'yes' : 'no'}
                onChange={(e) => setPatientField('emphysema', e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </div>
          <div className="fg c1" style={{ marginTop: 7 }}>
            <div className="fld">
              <label>Clinical context</label>
              <select
                id="ctx"
                value={patient.ctx}
                onChange={(e) => setPatientField('ctx', e.target.value as ClinicalContext | '')}
              >
                <option value="" disabled>— select —</option>
                <option value="incidental">Incidentally detected (clinical CT)</option>
                <option value="screening">Lung cancer screening program</option>
                <option value="biopsy">Referred for invasive workup / biopsy</option>
              </select>
            </div>
          </div>

          {/* Nodules */}
          <div className="slbl">Nodules</div>
          <div className="ncount-row">
            <label>Number of nodules:</label>
            <div className="ncount-ctrl">
              <button className="ncount-btn" onClick={() => changeCount(-1)}>−</button>
              <div className="ncount-val">{nodules.length}</div>
              <button className="ncount-btn" onClick={() => changeCount(1)}>+</button>
            </div>
            {manualSel && (
              <div className="auto-badge" onClick={resetAuto}>↺ Auto-select</div>
            )}
          </div>

          {nodules.length === 0 ? (
            <div className="no-nodules">
              Use <strong>+</strong> to add a nodule
            </div>
          ) : (
            <div className="nod-cards">
              {nodules.map((nod, i) => {
                const nodScore = formReady ? scoreNodule(nod, patient, ds) : 0;
                const nodCat = formReady
                  ? (ds.pet ? rcat(nodScore, true) : rcat(nodScore, false))
                  : 'low';
                return (
                  <NoduleCard
                    key={i}
                    nodule={nod}
                    index={i}
                    isSelected={i === effectiveSelIdx}
                    isManual={manualSel}
                    noduleCount={nodules.length}
                    ds={ds}
                    score={nodScore}
                    scoreCategory={nodCat}
                    onChange={handleNoduleChange}
                    onSelect={handleNoduleSelect}
                    onOpenEdgeTT={openTT}
                  />
                );
              })}
            </div>
          )}

          {/* BIMC prior */}
          <div className="slbl">BIMC prior probability</div>
          <div className="fg c1">
            <div className="fld">
              <label>
                Prevalence in referred population (%) — ~30% clinical, ~5% screening
              </label>
              <input
                type="number"
                id="prior"
                value={patient.prior}
                min={1}
                max={99}
                onChange={(e) => setPatientField('prior', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* ── Right panel: results ── */}
        <div className="res">
          {formReady ? (
            <ResultsTable
              patient={patient}
              noduleIndex={effectiveSelIdx}
              noduleCount={nodules.length}
              isManual={manualSel}
              ds={ds}
              mayo={M}
              brock={B}
              herder={H}
              bimc={I}
              bimcLRs={C}
              vdt={V}
              fleischner={F}
              warnings={allWarnings}
            />
          ) : (
            <div className="empty-results">
              <p className="empty-results-title">No results yet</p>
              <p className="empty-results-sub">
                {nodules.length === 0
                  ? 'Add at least one nodule and complete patient demographics.'
                  : 'Complete sex, smoking status, and clinical context to see results.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
