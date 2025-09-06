import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../style/mainpage.css';
import disabled from "../assets/disabled.png";
import parking from "../assets/parking.png";
import notcar from "../assets/notcar.png";
import { getDashboardSummary, getParkingStatus } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';
import * as d3 from 'd3';
import p1_csv_url from '../assets/p1.csv?url';
import p2_csv_url from '../assets/p2.csv?url';
import { subscribe as subscribeOverrides, getOverridesFor } from '../store/parkingOverrides';

const StatBox = ({ icon, title, value, total, valueColor, loading }) => {
  const { theme } = useTheme ? useTheme() : { theme: 'dark' };
  let districtName = '';
  try { districtName = localStorage.getItem('district_name') || ''; } catch (_) {}
  const dn = String(districtName || '').toLowerCase();
  const isGwangsan = dn.includes('광산') || dn.includes('gwangsan');
  const displayValue = isGwangsan ? '-' : value;
  const displayTotal = isGwangsan ? 0 : total;
  return (
    <div className='stat-box'>
      <img src={icon} alt={title} style={{ width: '80px', height: '80px', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
      <div className="stat-box-main">
        <div style={{ fontSize: "24px", fontFamily: "'Pretendard Variable', sans-serif" }}>{title}</div>
        <div>
          <span style={{ fontSize: "36px", color: valueColor, fontWeight: "900" }}>
            {displayValue}
          </span>
          {!loading && typeof displayTotal === 'number' && displayTotal > 0 && (
            <span style={{ color: "white", fontSize: "20px", fontWeight:"100" }}> / {displayTotal}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const StatisticsBox = () => {
  const [summary, setSummary] = useState({
    disabledParking: { current: 0, total: 0 },
    generalParking: { current: 0, total: 0 },
    todayViolations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState(() => {
    try { return localStorage.getItem('district_name') || ''; } catch (_) { return ''; }
  });
  const [ovDeltas, setOvDeltas] = useState({ disabled: 0, general: 0 });
  const typeCacheRef = useRef(new Map()); // idx -> Map(id->type)

  const parseLocalParkingIdx = () => {
    try {
      const v = localStorage.getItem('parking_idx');
      if (!v) return 1;
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 1;
    } catch (_) { return 1; }
  };

  const getCsvUrlByIdx = (idx) => (Number(idx) % 2 !== 0 ? p1_csv_url : p2_csv_url);
  const loadTypeMapForIdx = async (idx) => {
    const cached = typeCacheRef.current.get(idx);
    if (cached) return cached;
    const csvUrl = getCsvUrlByIdx(idx);
    const rows = await d3.csv(csvUrl, (row) => ({ id: String(row.id ?? ''), type: String(row.type ?? 'general') }));
    const map = new Map();
    rows.forEach((r) => { if (r.id) map.set(r.id, r.type || 'general'); });
    typeCacheRef.current.set(idx, map);
    return map;
  };

  useEffect(() => {
    let mounted = true;
    const load = () => {
      setLoading(true);
      getDashboardSummary()
        .then((data) => {
          if (mounted && data) setSummary(data);
        })
        .catch((err) => {
          console.error('Failed to load dashboard summary', err);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    const onDistrict = (e) => {
      const name = (e && e.detail && e.detail.name) || (typeof localStorage !== 'undefined' ? (localStorage.getItem('district_name') || '') : '');
      setDistrictName(name);
    };
    window.addEventListener('district-change', onDistrict);
    return () => {
      mounted = false;
      window.removeEventListener('parking-change', handler);
      window.removeEventListener('district-change', onDistrict);
    };
  }, []);

  // Recompute override deltas whenever overrides or parking selection change
  useEffect(() => {
    let alive = true;
    const compute = async () => {
      const idx = parseLocalParkingIdx();
      const overrides = getOverridesFor(idx);
      const ids = Object.keys(overrides || {});
      if (!ids.length) { if (alive) setOvDeltas({ disabled: 0, general: 0 }); return; }
      try {
        const [typeMap, statusList] = await Promise.all([
          loadTypeMapForIdx(idx),
          getParkingStatus({ parkingIdx: idx })
        ]);
        if (!alive) return;
        const statusMap = new Map();
        (Array.isArray(statusList) ? statusList : []).forEach((it) => {
          const key = String(it.space_id ?? '');
          if (!key) return;
          statusMap.set(key, !!it.is_occupied);
        });
        const deltas = { disabled: 0, general: 0 };
        ids.forEach((id) => {
          const finalOcc = !!overrides[id];
          const baseOcc = statusMap.get(String(id)) === true;
          if (finalOcc !== baseOcc) {
            const t = (typeMap.get(String(id)) || 'general') === 'disabled' ? 'disabled' : 'general';
            const add = (finalOcc ? 1 : 0) - (baseOcc ? 1 : 0);
            deltas[t] += add;
          }
        });
        if (alive) setOvDeltas(deltas);
      } catch (err) {
        console.error('Failed to compute override deltas', err);
        if (alive) setOvDeltas({ disabled: 0, general: 0 });
      }
    };
    compute();
    const unsub = subscribeOverrides(() => compute());
    const onChange = () => compute();
    window.addEventListener('parking-change', onChange);
    return () => { alive = false; try { unsub && unsub(); } catch (_) {} window.removeEventListener('parking-change', onChange); };
  }, []);

  const d = summary?.disabledParking || { current: 0, total: 0 };
  const g = summary?.generalParking || { current: 0, total: 0 };
  const dCurrentAdj = Math.max(0, Math.min((d.total || 0), (d.current || 0) + (ovDeltas.disabled || 0)));
  const gCurrentAdj = Math.max(0, Math.min((g.total || 0), (g.current || 0) + (ovDeltas.general || 0)));
  const disabledAvail = Math.max(0, (d.total || 0) - dCurrentAdj);
  const generalAvail = Math.max(0, (g.total || 0) - gCurrentAdj);

  const dn = String(districtName || '').toLowerCase();
  const isGwangsan = dn.includes('광산') || dn.includes('gwangsan');

  return (
    <div className="statistics-widget box-style">
      <div className="stats-container">
        <StatBox icon={disabled} title="장애인 잔여" value={disabledAvail} total={d.total} valueColor="#68D391" loading={loading} />
        <StatBox icon={parking} title="일반 잔여" value={generalAvail} total={g.total} valueColor="#63B3ED" loading={loading} />
        <StatBox icon={notcar} title="금일 위반" value={summary.todayViolations} valueColor="#E53E3E" loading={loading} />
      </div>
    </div>
  );
};

export default StatisticsBox;
