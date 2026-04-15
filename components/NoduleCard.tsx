'use client';

import { useState } from 'react';
import { calcDaysBetween, pct, cc, EDGES, VDT_METHODS } from '@/lib/models';
import type { Nodule, DataSwitches, EdgeKey, RiskCategory, VdtMethod } from '@/lib/models';

interface NoduleCardProps {
  nodule: Nodule;
  index: number;
  isSelected: boolean;
  isManual: boolean;
  noduleCount: number;
  ds: DataSwitches;
  score: number;
  scoreCategory: RiskCategory;
  onChange: (index: number, key: keyof Nodule, value: Nodule[keyof Nodule]) => void;
  onSelect: (index: number) => void;
  onOpenEdgeTT: (index: number, btn: HTMLButtonElement) => void;
}

export default function NoduleCard({
  nodule,
  index,
  isSelected,
  isManual,
  noduleCount,
  ds,
  score,
  scoreCategory,
  onChange,
  onSelect,
  onOpenEdgeTT,
}: NoduleCardProps) {
  const ddays = calcDaysBetween(nodule.d1, nodule.d2);
  const [vdtInfoOpen, setVdtInfoOpen] = useState<VdtMethod | null>(null);

  function handleEdgeBtnClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    onOpenEdgeTT(index, e.currentTarget);
  }

  return (
    <div className={'ncard' + (isSelected ? ' selected' : '')} id={'ncard-' + index}>
      {/* Header */}
      <div className="ncard-hdr" onClick={() => onSelect(index)}>
        <div className="nsel-dot" />
        <span className="nnum">Nodule {index + 1}</span>

        {isSelected && noduleCount > 1 ? (
          <span className="nidx-badge">{isManual ? 'selected' : 'auto-selected'}</span>
        ) : (
          <span />
        )}

        {noduleCount > 1 && (
          <span className={'nscore-badge ' + cc(scoreCategory)}>
            {pct(score)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="ncard-body">
        {/* Diameter + Composition */}
        <div className="fg">
          <div className="fld">
            <label>Diameter (mm)</label>
            <input
              type="number"
              id={'n' + index + '_d'}
              value={nodule.d}
              min={1}
              max={30}
              onChange={(e) => onChange(index, 'd', +e.target.value)}
            />
          </div>
          <div className="fld">
            <label>Composition</label>
            <select
              id={'n' + index + '_nt'}
              value={nodule.nt}
              onChange={(e) => onChange(index, 'nt', e.target.value as Nodule['nt'])}
            >
              <option value="solid">Solid</option>
              <option value="part_solid">Part-solid</option>
              <option value="ground_glass">Ground glass</option>
            </select>
          </div>
        </div>

        {/* Location + Spiculation */}
        <div className="fg">
          <div className="fld">
            <label>Location</label>
            <select
              id={'n' + index + '_loc'}
              value={nodule.loc}
              onChange={(e) => onChange(index, 'loc', e.target.value as Nodule['loc'])}
            >
              <option value="lower">Lower lobe</option>
              <option value="middle">Middle / lingula</option>
              <option value="upper">Upper lobe</option>
            </select>
          </div>
          <div className="fld">
            <label>Spiculation</label>
            <select
              id={'n' + index + '_sp'}
              value={nodule.sp ? 'yes' : 'no'}
              className={nodule.sp ? 'synced' : ''}
              onChange={(e) => onChange(index, 'sp', e.target.value === 'yes')}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>

        {/* Edge morphology */}
        <div className="fg c1">
          <div className="fld">
            <div className="fld-lr">
              <label>Edge morphology (BIMC)</label>
              <button
                className="info-btn"
                title="Show edge morphology guide"
                onClick={handleEdgeBtnClick}
              >
                ?
              </button>
            </div>
            <select
              id={'n' + index + '_edges'}
              value={nodule.edges}
              className={nodule.sp ? 'synced' : ''}
              onChange={(e) => onChange(index, 'edges', e.target.value as EdgeKey)}
            >
              {EDGES.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label} (LR {e.lr})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PET section */}
        {ds.pet && (
          <>
            <div className="ncard-sep" />
            <div className="fg">
              <div className="fld">
                <label>FDG uptake</label>
                <select
                  id={'n' + index + '_pet'}
                  value={nodule.pet}
                  onChange={(e) => onChange(index, 'pet', e.target.value as Nodule['pet'])}
                >
                  <option value="none">None / background</option>
                  <option value="faint">Faint (SUV 1–2.5)</option>
                  <option value="moderate">Moderate</option>
                  <option value="intense">Intense (SUV &gt;5)</option>
                </select>
              </div>
              <div className="fld">
                <label>SUV max</label>
                <input
                  type="number"
                  id={'n' + index + '_suv'}
                  value={nodule.suv}
                  min={0}
                  step={0.1}
                  onChange={(e) => onChange(index, 'suv', +e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* VDT section */}
        {ds.vdt && (
          <>
            <div className="ncard-sep" />
            {/* Dates */}
            <div className="fg">
              <div className="fld">
                <label>Date of 1st CT</label>
                <input
                  type="date"
                  id={'n' + index + '_d1'}
                  value={nodule.d1 || ''}
                  onChange={(e) => onChange(index, 'd1', e.target.value)}
                />
              </div>
              <div className="fld">
                <label>Date of 2nd CT</label>
                <input
                  type="date"
                  id={'n' + index + '_d2'}
                  value={nodule.d2 || ''}
                  onChange={(e) => onChange(index, 'd2', e.target.value)}
                />
              </div>
            </div>
            <div className="vdt-interval">
              {ddays !== null && ddays > 0 ? (
                <>
                  <span className="vdt-days-val">{ddays} days</span> between scans
                </>
              ) : ddays !== null && ddays < 0 ? (
                <span style={{ color: 'var(--int)' }}>
                  &#9888; 2nd CT date is before 1st CT date
                </span>
              ) : (
                <span className="vdt-days-empty">
                  Enter both CT dates to calculate interval
                </span>
              )}
            </div>
            {/* VDT method selector */}
            <div className="fld">
              <label>VDT formula</label>
              <div className="vdt-method-row">
                {VDT_METHODS.map((m) => (
                  <div
                    key={m.key}
                    className={'vdt-method-opt' + (nodule.vdtMethod === m.key ? ' sel' : '')}
                  >
                    <label className="vdt-method-lbl">
                      <input
                        type="radio"
                        name={'n' + index + '_vdtm'}
                        value={m.key}
                        checked={nodule.vdtMethod === m.key}
                        onChange={() => {
                          onChange(index, 'vdtMethod', m.key);
                          setVdtInfoOpen(null);
                        }}
                      />
                      {m.label}
                    </label>
                    <button
                      className={'info-btn' + (vdtInfoOpen === m.key ? ' active' : '')}
                      title={m.shortDesc}
                      onClick={(e) => {
                        e.stopPropagation();
                        setVdtInfoOpen(vdtInfoOpen === m.key ? null : m.key);
                      }}
                    >
                      ?
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {vdtInfoOpen && (
              <div className="vdt-info-panel">
                {VDT_METHODS.find((m) => m.key === vdtInfoOpen)?.desc}
              </div>
            )}
            {/* Size inputs — vary by method */}
            {nodule.vdtMethod === 'volumetric' && (
              <div className="fg">
                <div className="fld">
                  <label>Volume scan 1 (mm&#179;)</label>
                  <input
                    type="number"
                    id={'n' + index + '_v1'}
                    value={nodule.v1 || ''}
                    min={0}
                    placeholder="0"
                    onChange={(e) => onChange(index, 'v1', +e.target.value)}
                  />
                </div>
                <div className="fld">
                  <label>Volume scan 2 (mm&#179;)</label>
                  <input
                    type="number"
                    id={'n' + index + '_v2'}
                    value={nodule.v2 || ''}
                    min={0}
                    placeholder="0"
                    onChange={(e) => onChange(index, 'v2', +e.target.value)}
                  />
                </div>
              </div>
            )}
            {nodule.vdtMethod === 'diametric' && (
              <>
                <div className="fg c3">
                  <div className="fld">
                    <label>X&#8321; (mm)</label>
                    <input type="number" id={'n' + index + '_x1'} value={nodule.x1 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'x1', +e.target.value)} />
                  </div>
                  <div className="fld">
                    <label>Y&#8321; (mm)</label>
                    <input type="number" id={'n' + index + '_y1'} value={nodule.y1 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'y1', +e.target.value)} />
                  </div>
                  <div className="fld">
                    <label>Z&#8321; (mm)</label>
                    <input type="number" id={'n' + index + '_z1'} value={nodule.z1 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'z1', +e.target.value)} />
                  </div>
                </div>
                <div className="fg c3">
                  <div className="fld">
                    <label>X&#8322; (mm)</label>
                    <input type="number" id={'n' + index + '_x2'} value={nodule.x2 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'x2', +e.target.value)} />
                  </div>
                  <div className="fld">
                    <label>Y&#8322; (mm)</label>
                    <input type="number" id={'n' + index + '_y2'} value={nodule.y2 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'y2', +e.target.value)} />
                  </div>
                  <div className="fld">
                    <label>Z&#8322; (mm)</label>
                    <input type="number" id={'n' + index + '_z2'} value={nodule.z2 || ''} min={0} placeholder="0" onChange={(e) => onChange(index, 'z2', +e.target.value)} />
                  </div>
                </div>
              </>
            )}
            {nodule.vdtMethod === 'spherical' && (
              <div className="fg">
                <div className="fld">
                  <label>Diameter scan 1 (mm)</label>
                  <input
                    type="number"
                    id={'n' + index + '_s1'}
                    value={nodule.s1 || ''}
                    min={0}
                    placeholder="0"
                    onChange={(e) => onChange(index, 's1', +e.target.value)}
                  />
                </div>
                <div className="fld">
                  <label>Diameter scan 2 (mm)</label>
                  <input
                    type="number"
                    id={'n' + index + '_s2'}
                    value={nodule.s2 || ''}
                    min={0}
                    placeholder="0"
                    onChange={(e) => onChange(index, 's2', +e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Density section */}
        {ds.den && (
          <>
            <div className="ncard-sep" />
            <div className="fg c1">
              <div className="fld">
                <label>Min focal density</label>
                <select
                  id={'n' + index + '_den'}
                  value={nodule.den}
                  onChange={(e) => onChange(index, 'den', e.target.value as Nodule['den'])}
                >
                  <option value="lt_neg60">Below −60 HU (fat)</option>
                  <option value="neg60_neg30">−60 to −30 HU</option>
                  <option value="gt_neg30">Above −30 HU (soft tissue)</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Enhancement section */}
        {ds.enh && (
          <>
            <div className="ncard-sep" />
            <div className="fg c1">
              <div className="fld">
                <label>CT enhancement (dynamic contrast)</label>
                <select
                  id={'n' + index + '_enh'}
                  value={nodule.enh === 'unknown' ? 'lt15' : nodule.enh}
                  onChange={(e) => onChange(index, 'enh', e.target.value as Nodule['enh'])}
                >
                  <option value="lt15">Below 15 HU</option>
                  <option value="15_40">15–40 HU</option>
                  <option value="gt40">Above 40 HU</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
