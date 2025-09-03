import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import P1_SVG from '../assets/p1.svg?react';
import P2_SVG from '../assets/p2.svg?react';
import p1_csv_url from '../assets/p1.csv?url';
import p2_csv_url from '../assets/p2.csv?url';
import { getParkingStatus } from '../services/api';

// Authoritative map viewBoxes
const viewBoxes = {
  p1: { width: 703.033, height: 647.28 },
  p2: { width: 595, height: 842 },
};

function parseLocalParkingIdx() {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem('parking_idx') : null;
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  } catch (_) {
    return null;
  }
}

const MainpageMap = ({ parking_idx, maxWidth }) => {
  const containerRef = useRef(null);

  // Decide effective parking idx: prop > localStorage > 1
  const [effectiveIdx, setEffectiveIdx] = useState(() => {
    if (Number.isFinite(parking_idx)) return parking_idx;
    const local = parseLocalParkingIdx();
    return local ?? 1;
  });

  useEffect(() => {
    if (Number.isFinite(parking_idx)) setEffectiveIdx(parking_idx);
  }, [parking_idx]);

  useEffect(() => {
    const onChange = (e) => {
      const val = (e && (e.detail ?? e.detail?.value)) ?? parseLocalParkingIdx() ?? 1;
      const n = parseInt(val, 10);
      if (Number.isFinite(n)) setEffectiveIdx(n);
    };
    try { window.addEventListener('parking-change', onChange); } catch (_) {}
    return () => { try { window.removeEventListener('parking-change', onChange); } catch (_) {} };
  }, []);

  // Pick assets by odd/even
  const { MapComponent, csvUrl, viewBox, isP2 } = useMemo(() => {
    const isOdd = Number(effectiveIdx) % 2 !== 0;
    if (isOdd) return { MapComponent: P1_SVG, csvUrl: p1_csv_url, viewBox: viewBoxes.p1, isP2: false };
    return { MapComponent: P2_SVG, csvUrl: p2_csv_url, viewBox: viewBoxes.p2, isP2: true };
  }, [effectiveIdx]);

  // CSV geometry
  const [geoList, setGeoList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!csvUrl) { setGeoList([]); return () => {}; }
    d3.csv(csvUrl, (row) => {
      const x = Number(row.x);
      const y = Number(row.y);
      const width = row.width !== undefined ? Number(row.width) : Number(row.w);
      const height = row.height !== undefined ? Number(row.height) : Number(row.h);
      return {
        id: String(row.id ?? ''),
        type: String(row.type ?? 'general'),
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        width: Number.isFinite(width) ? width : 0,
        height: Number.isFinite(height) ? height : 0,
      };
    }).then((rows) => {
      if (cancelled) return;
      setGeoList(Array.isArray(rows) ? rows : []);
    }).catch(() => { if (!cancelled) setGeoList([]); });
    return () => { cancelled = true; };
  }, [csvUrl]);

  // Occupancy from API
  const [statusMap, setStatusMap] = useState(() => new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getParkingStatus({ parkingIdx: effectiveIdx });
        if (cancelled) return;
        const m = new Map();
        (Array.isArray(list) ? list : []).forEach((it) => {
          const key = String(it.space_id ?? '');
          if (!key) return;
          m.set(key, !!it.is_occupied);
        });
        setStatusMap(m);
      } catch (_) {
        if (!cancelled) setStatusMap(new Map());
      }
    }
    load();
    return () => { cancelled = true; };
  }, [effectiveIdx]);

  const mergedSlots = useMemo(() => {
    return geoList.map((g) => ({
      ...g,
      occupied: statusMap.get(String(g.id)) === true,
    }));
  }, [geoList, statusMap]);

  const containerStyle = useMemo(() => {
    const defaultClamp = 'clamp(520px, 60vw, 900px)';
    const p2Clamp = 'clamp(480px, 52vw, 820px)'; // slightly smaller to reduce vertical footprint
    return {
      maxWidth: maxWidth || (isP2 ? p2Clamp : defaultClamp),
      margin: '0 auto',
    };
  }, [maxWidth, isP2]);

  const [stageHeight, setStageHeight] = useState(0);

  // Robust height calculation to keep base SVG and overlay aligned even if CSS aspect-ratio is not supported
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ratio = viewBox.height / viewBox.width;
    const update = () => {
      const w = el.clientWidth || el.getBoundingClientRect().width || 0;
      setStageHeight(Math.max(1, Math.round(w * ratio)));
    };
    let ro;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(update);
      try { ro.observe(el); } catch (_) {}
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', update);
    }
    update();
    return () => {
      if (ro) { try { ro.disconnect(); } catch (_) {} }
      else if (typeof window !== 'undefined') { window.removeEventListener('resize', update); }
    };
  }, [viewBox]);

  const stageStyle = useMemo(() => ({
    aspectRatio: `${viewBox.width} / ${viewBox.height}`,
    height: stageHeight ? `${stageHeight}px` : undefined,
  }), [viewBox, stageHeight]);

  return (
    <div className="parking-map-container mainmap" style={containerStyle} ref={containerRef}>
      <div className="svg-stage" style={stageStyle}>
        {MapComponent && <MapComponent className="map-base-svg" />}
        <svg
          className="slot-overlay-svg"
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Parking slots overlay"
        >
          <g className="slots">
            {mergedSlots.map((s) => {
              const fill = s.occupied
                ? 'rgba(229, 62, 62, 0.75)'
                : (s.type === 'disabled' ? 'rgba(49, 130, 206, 0.55)' : 'rgba(56, 161, 105, 0.60)');
              return (
                <rect
                  key={s.id}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  className={`slot ${s.type || 'general'} ${s.occupied ? 'occupied' : 'free'}`}
                  fill={fill}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={1}
                  rx={4}
                  ry={4}
                >
                  <title>{`${s.id}: ${s.type} - ${s.occupied ? 'occupied' : 'available'}`}</title>
                </rect>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MainpageMap;

