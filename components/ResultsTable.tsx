'use client';

import type {
  PatientInputs,
  DataSwitches,
  Warning,
  BimcLRResult,
  FleischnerResult,
  RiskCategory,
} from '@/lib/models';
import { pct, cc, rcat } from '@/lib/models';

// ── Small helpers ──────────────────────────────────────────────────────────

function Pill({ cat, label }: { cat: RiskCategory | 'na'; label?: string }) {
  const defaultLabels: Record<string, string> = {
    low: 'Low',
    intc: 'Intermediate',
    high: 'High',
    na: '—',
  };
  return (
    <span className={'pill ' + cat}>{label ?? defaultLabels[cat] ?? '—'}</span>
  );
}

function WChips({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null;
  return (
    <div className="wchips">
      {warnings.map((w, i) => (
        <span key={i} className={'wchip ' + w.l}>
          <span>{w.l === 'e' ? '⊘' : '⚠'}</span>
          {w.t}
        </span>
      ))}
    </div>
  );
}

function rowCls(ws: Warning[]): string {
  if (ws.some((w) => w.l === 'e')) return 'has-err';
  if (ws.length > 0) return 'has-warn';
  return '';
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ResultsTableProps {
  patient: PatientInputs;
  noduleIndex: number;
  noduleCount: number;
  isManual: boolean;
  ds: DataSwitches;
  mayo: number;
  brock: number;
  herder: number | null;
  bimc: number;
  bimcLRs: BimcLRResult;
  vdt: number | null;
  fleischner: FleischnerResult;
  warnings: {
    mayo: Warning[];
    brock: Warning[];
    herder: Warning[];
    bimc: Warning[];
    fleisch: Warning[];
    vdt: Warning[];
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ResultsTable({
  patient,
  noduleIndex,
  noduleCount,
  isManual,
  ds,
  mayo,
  brock,
  herder,
  bimc,
  bimcLRs,
  vdt,
  fleischner,
  warnings,
}: ResultsTableProps) {
  const vdtOn = vdt !== null && vdt > 0;
  const ctx = patient.ctx;

  // Summary metrics
  const probs = [mayo, brock, herder, bimc].filter((x): x is number => x !== null);
  const hiP = probs.length ? Math.max(...probs) : 0;
  // Use BTS threshold only when Herder produced the highest probability; otherwise ACCP.
  const herderIsHighest = herder !== null && herder === hiP;
  const hiCat = herderIsHighest ? rcat(hiP, true) : rcat(hiP, false);
  const hiCount = probs.filter((x) => x >= 0.65).length;

  const nodLabel = (
    <span>
      <span className="nod-used">
        Nodule {noduleIndex + 1}
        {noduleCount > 1 ? (isManual ? ' — manual' : ' — auto') : ''}
      </span>
      <br />
    </span>
  );

  // Model row categories
  const mc = rcat(mayo, false);
  const bc = rcat(brock, false);
  const hc = herder !== null ? rcat(herder, true) : null;
  const ic = rcat(bimc, false);

  // VDT row values
  let vCat: RiskCategory | 'na' = 'na';
  let vResult = '—';
  let vNote = 'Enter sizes and interval';
  if (vdtOn && vdt !== null) {
    if (vdt <= 400) { vCat = 'high'; vResult = Math.round(vdt) + ' days'; vNote = '25–400 d → malignant kinetics'; }
    else if (vdt <= 900) { vCat = 'intc'; vResult = Math.round(vdt) + ' days'; vNote = '401–900 d → intermediate'; }
    else { vCat = 'low'; vResult = Math.round(vdt) + ' days'; vNote = '>900 d → benign pattern'; }
  } else if (vdt !== null && vdt < 0) {
    vCat = 'low'; vResult = 'Shrinking'; vNote = 'Nodule is decreasing in size';
  }

  // Interpretation items
  const interpItems: Array<{ c: 'hi' | 'intc' | 'info'; t: string }> = [];
  if (noduleCount > 1) {
    interpItems.push({
      c: 'info',
      t: `Nodule ${noduleIndex + 1} is ${isManual ? 'manually' : 'auto-'}selected. Click a nodule card to switch; "↺ Auto-select" to reset.`,
    });
  }
  if (herder !== null && herder >= 0.90) {
    interpItems.push({
      c: 'hi',
      t: `Herder: ${pct(herder)} — exceeds 70% BTS surgical threshold. Tissue diagnosis is indicated. A negative biopsy requires reassessment.`,
    });
  }
  if (bimc >= 0.90) {
    interpItems.push({
      c: 'hi',
      t: `BIMC: ${pct(bimc)} (exact Soardi 2015 LRs). VDT-derived LR of 14.472 is the dominant driver, substantially outweighing the never-smoker and lower-lobe terms that suppress CT-only models.`,
    });
  }
  if (vdtOn && vdt !== null && vdt <= 400) {
    interpItems.push({
      c: 'hi',
      t: `VDT ${Math.round(vdt)} d: within the 25–400 d malignant kinetic window. BTS considers this independently sufficient to prompt tissue evaluation.`,
    });
  }
  if (mayo < 0.25 && brock < 0.30) {
    interpItems.push({
      c: 'intc',
      t: `CT-only models (Mayo ${pct(mayo)}, Brock ${pct(brock)}): structurally suppressed in never-smokers with lower-lobe non-spiculated nodules. Do not use as primary arbiters when PET and growth data are available.`,
    });
  }
  if (ctx === 'biopsy') {
    interpItems.push({
      c: 'intc',
      t: 'Biopsy-referred setting: Heideman et al. (CHEST Pulm 2024) showed CT-only models had AUC ~0.70 with poor calibration and likely underestimate probability. Herder (AUC 0.77 with PET) is the most reliable model in this context. <5% of biopsy-referred nodules fall into the "low-risk" category by any CT model.',
    });
  }
  interpItems.push({
    c: 'info',
    t: `Fleischner 2017: solid nodule >8 mm${ds.pet ? ' with positive PET — routes to tissue sampling.' : ' — consider CT 3 mo, PET-CT, or tissue sampling.'}`,
  });

  return (
    <>
      {/* Summary metrics */}
      <div className="sum-grid">
        <div className="met">
          <p className="met-lbl">Highest probability</p>
          <p className={'met-val ' + cc(hiCat)}>{pct(hiP)}</p>
          <p className="met-sub">
            Nodule {noduleIndex + 1}
            {noduleCount > 1 ? (isManual ? ' (manual)' : noduleCount > 1 ? ' (auto)' : '') : ''}
          </p>
        </div>
        <div className="met">
          <p className="met-lbl">VDT (index nodule)</p>
          <p className={'met-val ' + (vdtOn && vdt !== null ? (vdt <= 400 ? 'hi' : vdt <= 900 ? 'intc' : 'low') : '')}>
            {vdtOn && vdt !== null ? Math.round(vdt) + 'd' : ds.vdt ? 'enter sizes' : '—'}
          </p>
          <p className="met-sub">
            {vdtOn && vdt !== null
              ? vdt <= 400
                ? 'Malignant kinetics'
                : vdt <= 900
                  ? 'Intermediate'
                  : 'Benign pattern'
              : ''}
          </p>
        </div>
        <div className="met">
          <p className="met-lbl">High-risk models</p>
          <p className="met-val hi">{hiCount}/{probs.length}</p>
        </div>
      </div>

      {/* Stress banner */}
      {ctx === 'biopsy' && (
        <div className="stress-banner">
          <strong>⚠ Biopsy-referred context (Heideman et al., CHEST Pulm 2024):</strong> In a
          prospective cohort of 322 nodules referred for navigational bronchoscopy (57% malignancy
          prevalence), all CT-only models showed AUC ~0.70 with poor calibration — Brock had the
          worst Brier score (0.36). Models{' '}
          <strong>likely underestimate</strong> true probability in this setting. Herder performed
          best (AUC 0.77) when PET-CT was available. Low agreement between CT-only models on
          intermediate-risk nodules. Clinical judgment and PET-CT data should take precedence.
        </div>
      )}
      {ctx === 'screening' && (
        <div className="stress-banner">
          <strong>⚠ Screening context:</strong> Brock was derived and validated in screening
          populations (5.5% prevalence) and is most appropriate here. Mayo Clinic model was derived
          from incidentally detected nodules (23% prevalence) and may overestimate in screening.
          Herder requires PET-CT which is not routine in screening programs.
        </div>
      )}

      {/* Results table */}
      <div className="rtbl-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: '32%' }}>Model</th>
              <th style={{ width: '15%' }}>Result</th>
              <th style={{ width: '15%' }}>Category</th>
              <th>Notes &amp; Warnings</th>
            </tr>
          </thead>
          <tbody>
            {/* Mayo */}
            <tr className={rowCls(warnings.mayo)}>
              <td>
                <p className="mname">Mayo Clinic</p>
                <p className="mref">Swensen et al., Arch Intern Med 1997</p>
                <p className="mvars">
                  Age · smoke · size · spiculation · upper lobe · prior Ca · derived 4–30 mm,
                  solid, incidental
                </p>
              </td>
              <td>
                {nodLabel}
                <p className={'pval ' + cc(mc)}>{pct(mayo)}</p>
              </td>
              <td>
                <Pill cat={mc} />
              </td>
              <td>
                <span className="tnote">ACCP · no PET term</span>
                <WChips warnings={warnings.mayo} />
              </td>
            </tr>

            {/* Brock */}
            <tr className={rowCls(warnings.brock)}>
              <td>
                <p className="mname">Brock (McWilliams)</p>
                <p className="mref">McWilliams et al., NEJM 2013</p>
                <p className="mvars">
                  Adds sex · family hx · emphysema · composition · count · derived screening pop,
                  age 40–74
                </p>
              </td>
              <td>
                {nodLabel}
                <p className={'pval ' + cc(bc)}>{pct(brock)}</p>
              </td>
              <td>
                <Pill cat={bc} />
              </td>
              <td>
                <span className="tnote">ACCP · count = {noduleCount}</span>
                <WChips warnings={warnings.brock} />
              </td>
            </tr>

            {/* Herder */}
            {herder !== null && hc !== null ? (
              <tr className={rowCls(warnings.herder)}>
                <td>
                  <p className="mname">Herder</p>
                  <p className="mref">Herder et al., Chest 2005</p>
                  <p className="mvars">
                    PET-CT integrated · best calibrated in biopsy-referred settings · n=106
                  </p>
                </td>
                <td>
                  {nodLabel}
                  <p className={'pval ' + cc(hc)}>{pct(herder)}</p>
                </td>
                <td>
                  <Pill cat={hc} />
                </td>
                <td>
                  <span className="tnote">BTS: &lt;10% / 10–70% / &gt;70%</span>
                  <WChips warnings={warnings.herder} />
                </td>
              </tr>
            ) : (
              <tr className="off">
                <td>
                  <p className="mname">Herder</p>
                  <p className="mref">Herder et al., Chest 2005</p>
                </td>
                <td colSpan={2}>
                  <span className="needs-tag">Requires FDG-PET data</span>
                </td>
                <td>
                  <span className="tnote">Enable FDG-PET toggle</span>
                </td>
              </tr>
            )}

            {/* BIMC */}
            <tr className={rowCls(warnings.bimc)}>
              <td>
                <p className="mname">BIMC (Soardi)</p>
                <p className="mref">Soardi et al., Eur Radiol 2015</p>
                <p className="mvars">Bayesian · exact ESM LRs · solid 4–30 mm only</p>
                <div className="lr-chips">
                  {bimcLRs.chips.map((chip, i) => (
                    <span key={i} className={'lrc' + (chip.on ? ' on' : '')}>
                      {chip.l} ×{chip.v.toFixed(3)}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                {nodLabel}
                <p className={'pval ' + cc(ic)}>{pct(bimc)}</p>
              </td>
              <td>
                <Pill cat={ic} />
              </td>
              <td>
                <span className="tnote">ACCP · inactive = LR 1.0</span>
                <WChips warnings={warnings.bimc} />
              </td>
            </tr>

            {/* Fleischner */}
            <tr className={rowCls(warnings.fleisch)}>
              <td>
                <p className="mname">Fleischner 2017</p>
                <p className="mref">MacMahon et al., Radiology 2017</p>
                <p className="mvars">
                  Management guidance · not a probability score · adults with incidental nodules
                </p>
              </td>
              <td colSpan={2}>
                <p className="fleisch-rec">{fleischner.rec}</p>
                <p className="psub">{fleischner.note}</p>
              </td>
              <td>
                <Pill
                  cat={fleischner.cat}
                  label={
                    { low: 'Low priority', intc: 'Surveillance', high: 'Tissue sampling' }[
                      fleischner.cat
                    ]
                  }
                />
                <WChips warnings={warnings.fleisch} />
              </td>
            </tr>

            {/* VDT */}
            {ds.vdt ? (
              <tr className={rowCls(warnings.vdt)}>
                <td>
                  <p className="mname">BTS VDT</p>
                  <p className="mref">Callister et al., Thorax 2015</p>
                  <p className="mvars">Two-point measurement · malignant 25–400 d (solid)</p>
                </td>
                <td>
                  {nodLabel}
                  <p className={'pval ' + (vCat === 'na' ? '' : cc(vCat))}>{vResult}</p>
                </td>
                <td>
                  <Pill
                    cat={vCat}
                    label={
                      { low: 'Benign', intc: 'Intermediate', high: 'Malignant', na: '—' }[vCat]
                    }
                  />
                </td>
                <td>
                  <span className="tnote">{vNote}</span>
                  <WChips warnings={warnings.vdt} />
                </td>
              </tr>
            ) : (
              <tr className="off">
                <td>
                  <p className="mname">BTS VDT</p>
                  <p className="mref">Callister et al., Thorax 2015</p>
                </td>
                <td colSpan={2}>
                  <span className="needs-tag">Requires two-point measurements</span>
                </td>
                <td>
                  <span className="tnote">Enable size measurements toggle</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="disc">
          <strong>ACCP:</strong> Low &lt;5% · Int 5–65% · High &gt;65%.&ensp;
          <strong>BTS/Herder:</strong> Low &lt;10% · Int 10–70% · High &gt;70%.&ensp;
          <strong style={{ color: 'var(--high)' }}>⊘</strong> = outside validated range.&ensp;
          <strong style={{ color: 'var(--int)' }}>⚠</strong> = population mismatch / calibration
          caution.&ensp; BIMC solid 4–30 mm only. Clinician use only.
        </div>
      </div>

      {/* Interpretation box */}
      <div className="ibox">
        <p className="ititle">Clinical interpretation</p>
        {interpItems.map((item, i) => (
          <div key={i} className="iitem">
            <div className={'dot ' + item.c} />
            <p className="itxt">{item.t}</p>
          </div>
        ))}
        <div className="bimc-note">
          BIMC: exact LRs from Soardi et al., Eur Radiol 2015 (ESM v1). &ldquo;Deeply
          lobulated&rdquo; = &ldquo;Lobulated&rdquo; in ESM. Inactive inputs = LR 1.0. Blue chips =
          active inputs.
        </div>
      </div>
    </>
  );
}
