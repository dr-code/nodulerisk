'use client';

import { useEffect, useRef } from 'react';
import { EDGES, type EdgeKey } from '@/lib/models';

// ── SVG nodule outline ─────────────────────────────────────────────────────
// Uses CSS custom properties for fill/stroke so dark-mode switching is handled
// entirely in CSS — no window.matchMedia needed.

function EdgeSVG({ type, selected }: { type: EdgeKey; selected: boolean }) {
  const s = 50;
  const cx = s / 2;
  const cy = s / 2;
  const n = 120;
  const pts: string[] = [];

  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * Math.PI;
    let r: number;

    if (type === 'smooth') {
      r = s * 0.36;
    } else if (type === 'min_lob') {
      r = s * 0.34 + s * 0.035 * Math.sin(3 * t + 0.4) + s * 0.018 * Math.sin(7 * t + 1.2);
    } else if (type === 'lobulated') {
      r =
        s * 0.30 +
        s * 0.09 * Math.pow(Math.sin(2 * t + 0.3), 2) +
        s * 0.06 * Math.pow(Math.sin(3 * t + 1), 2);
    } else if (type === 'frayed') {
      r =
        s * 0.31 +
        s * 0.05 * Math.sin(6 * t) +
        s * 0.04 * Math.sin(11 * t + 0.7) +
        s * 0.03 * Math.sin(17 * t + 2.1) +
        s * 0.025 * Math.sin(5 * t + 1.4);
    } else {
      // spiculated
      const base = s * 0.26;
      const spk = 9;
      const ang = ((t / (2 * Math.PI)) * spk) % 1;
      const spk2 = ang < 0.08 ? ang / 0.08 : ang < 0.16 ? (0.16 - ang) / 0.08 : 0;
      r = base + s * 0.22 * Math.pow(spk2, 0.6);
    }

    pts.push(
      (cx + r * Math.cos(t)).toFixed(1) + ',' + (cy + r * Math.sin(t)).toFixed(1),
    );
  }

  // CSS custom properties drive fill/stroke for automatic dark-mode support
  const fill = selected ? 'var(--accent-bg)' : 'var(--surface2)';
  const stroke = selected ? 'var(--accent)' : 'var(--text3)';

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon
        points={pts.join(' ')}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Edge tooltip component ─────────────────────────────────────────────────

interface EdgeTooltipProps {
  noduleIndex: number;
  currentEdge: EdgeKey;
  anchorRect: DOMRect;
  onSelect: (noduleIndex: number, edge: EdgeKey) => void;
  onClose: () => void;
}

export default function EdgeTooltip({
  noduleIndex,
  currentEdge,
  anchorRect,
  onSelect,
  onClose,
}: EdgeTooltipProps) {
  const ttRef = useRef<HTMLDivElement>(null);

  // Clamp position to viewport, matching original logic
  useEffect(() => {
    const tt = ttRef.current;
    if (!tt) return;
    const ttWidth = 520;
    const ttHeight = 320;
    let left = anchorRect.left;
    let top = anchorRect.bottom + 6;
    if (left + ttWidth > window.innerWidth - 8) left = window.innerWidth - ttWidth - 8;
    if (left < 8) left = 8;
    if (top + ttHeight > window.innerHeight - 8) top = anchorRect.top - ttHeight - 6;
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
  }, [anchorRect]);

  const currentEdgeInfo = EDGES.find((e) => e.key === currentEdge);

  return (
    <>
      {/* Overlay catches clicks outside the tooltip */}
      <div
        id="ett-overlay"
        style={{ display: 'block' }}
        onClick={onClose}
      />

      <div id="edge-tt" ref={ttRef} style={{ display: 'block' }}>
        <p className="ett-title">
          Edge morphology — Fleischner / Soardi 2015 (Fig. 2)
        </p>

        <div className="ett-grid">
          {EDGES.map((e) => {
            const sel = e.key === currentEdge;
            return (
              <div
                key={e.key}
                className={'ett-card' + (sel ? ' sel' : '')}
                onClick={() => onSelect(noduleIndex, e.key)}
              >
                <EdgeSVG type={e.key} selected={sel} />
                <span className="ett-name">{e.label}</span>
                <span className={'ett-lr ' + e.lrc}>LR {e.lr}</span>
              </div>
            );
          })}
        </div>

        <div className="ett-desc">{currentEdgeInfo?.desc ?? ''}</div>

        <p className="ett-note">
          Fig. 2: &ldquo;Growing complexity of nodule edges, from left to right: smooth, minimally
          lobulated, deeply lobulated, frayed, spiculated.&rdquo; &ldquo;Lobulated&rdquo; in ESM =
          &ldquo;deeply lobulated&rdquo; in paper. BIMC validated for solid nodules (4–30 mm) only.
        </p>
      </div>
    </>
  );
}
