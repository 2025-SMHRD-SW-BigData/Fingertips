import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import P1_SVG from '../assets/p1.svg?react';
import p2_img_url from '../assets/p2.png';
import p1_csv_url from '../assets/p1.csv?url';
import p2_csv_url from '../assets/p2.csv?url';
import { getParkingStatus } from '../services/api';
import { subscribe as subscribeOverrides, getOverride as getOverrideFor, toggle as toggleOverride } from '../store/parkingOverrides';

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

  // Re-render when overrides change
  const [ovVersion, setOvVersion] = useState(0);
  useEffect(() => {
    const unsub = subscribeOverrides(() => setOvVersion((v) => v + 1));
    return () => { try { unsub && unsub(); } catch (_) {} };
  }, []);

  // Pick assets by odd/even
  const [p2Dims, setP2Dims] = useState(viewBoxes.p2);

  useEffect(() => {
    // Preload p2.png and capture its natural size to align overlay correctly
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || viewBoxes.p2.width;
      const h = img.naturalHeight || viewBoxes.p2.height;
      setP2Dims({ width: w, height: h });
    };
    img.onerror = () => {
      // keep default dims on error
    };
    img.src = p2_img_url;
  }, []);

  const { baseType, MapComponent, imgUrl, csvUrl, viewBox, isP2 } = useMemo(() => {
    const isOdd = Number(effectiveIdx) % 2 !== 0;
    if (isOdd) return { baseType: 'svg', MapComponent: P1_SVG, imgUrl: null, csvUrl: p1_csv_url, viewBox: viewBoxes.p1, isP2: false };
    return { baseType: 'img', MapComponent: null, imgUrl: p2_img_url, csvUrl: p2_csv_url, viewBox: p2Dims, isP2: true };
  }, [effectiveIdx, p2Dims]);

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
  }, [geoList, statusMap, ovVersion]);

  const containerStyle = useMemo(() => {
    const defaultClamp = 'clamp(520px, 60vw, 900px)';
    const p2Clamp = 'clamp(480px, 52vw, 820px)';
    return {
      width: '100%',
      maxWidth: maxWidth || (isP2 ? p2Clamp : defaultClamp),
      margin: 0,
    };
  }, [maxWidth, isP2]);

  const [stageHeight, setStageHeight] = useState(0);

  // Robust height calculation to keep base SVG and overlay aligned even if CSS aspect-ratio is not supported
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ratio = viewBox.height / viewBox.width;
    const compute = () => {
      const w = el.clientWidth || el.getBoundingClientRect().width || 0;
      const raw = Math.max(1, Math.round(w * ratio));
      const vh = (typeof window !== 'undefined' ? window.innerHeight : 0) || 0;
      const cap = vh ? Math.floor(Math.min(vh * 0.6, 640)) : 640;
      setStageHeight(Math.min(raw, cap));
    };
    let ro; let raf = 0; let tid = 0;
    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (tid) clearTimeout(tid);
        tid = setTimeout(compute, 50);
      });
    };
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(schedule);
      try { ro.observe(el); } catch (_) {}
      window.addEventListener('resize', schedule);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', schedule);
    }
    compute();
    return () => {
      if (ro) { try { ro.disconnect(); } catch (_) {} }
      if (typeof window !== 'undefined') { window.removeEventListener('resize', schedule); }
      if (raf) cancelAnimationFrame(raf);
      if (tid) clearTimeout(tid);
    };
  }, [viewBox]);

  const stageStyle = useMemo(() => ({
    aspectRatio: `${viewBox.width} / ${viewBox.height}`,
    height: stageHeight ? `${stageHeight}px` : undefined,
  }), [viewBox, stageHeight]);

  return (
    <div className="parking-map-container mainmap" style={containerStyle} ref={containerRef}>
      <div className="svg-stage" style={stageStyle}>
        {baseType === 'svg' && MapComponent && <MapComponent className="map-base-svg" />}
        {baseType === 'img' && imgUrl && (
          <img src={imgUrl} alt="Parking map" className="map-base-img" />
        )}
        <svg
          className="slot-overlay-svg"
          style={{ pointerEvents: 'auto' }}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Parking slots overlay"
        >
          <g className="slots">
            {mergedSlots.map((s) => {
              const override = getOverrideFor(effectiveIdx, s.id);
              const effectiveOccupied = typeof override === 'boolean' ? override : s.occupied;
              return (
                <rect
                  key={s.id}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  className={`slot ${s.type || 'general'} ${effectiveOccupied ? 'occupied' : 'free'}`}
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={1}
                  rx={4}
                  ry={4}
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentEff = effectiveOccupied;
                    toggleOverride({ parkingIdx: effectiveIdx, id: s.id, currentEffective: currentEff });
                    try { window.dispatchEvent(new Event('parking-change')); } catch (_) {}
                  }}
                >
                  <title>{`${s.id}: ${s.type} - ${effectiveOccupied ? 'occupied' : 'available'}`}</title>
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
