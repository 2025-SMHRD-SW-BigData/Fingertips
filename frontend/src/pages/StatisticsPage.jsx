import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/mainpage.css';
import '../style/StatisticsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import { getStatsByType, getStatsByDate, getStatsByLocation, getStatsByHour } from '../services/api';
import ParkingControls from '../component/ParkingControls';

const StatisticsPage = () => {
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return { date: '', from: '', to: `${y}-${m}-${d}`, place: '', type: '' };
  });

  const [byType, setByType] = useState({ data: [], loading: true, error: null });
  const [byDate, setByDate] = useState({ data: [], loading: true, error: null });
  const [byHour, setByHour] = useState({ data: [], loading: false, error: null });
  const [byLocation, setByLocation] = useState({ data: [], loading: true, error: null });
  const [parkingIdx, setParkingIdx] = useState(() => (typeof localStorage !== 'undefined' ? (localStorage.getItem('parking_idx') || '') : ''));
  const [ttType, setTtType] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [ttDate, setTtDate] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [ttLoc, setTtLoc] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [granularity, setGranularity] = useState('day');
  const [chartRange, setChartRange] = useState({ from: '', to: '' });
  const navigate = useNavigate();

  // Helpers for date formats and YEARWEEK conversion
  const onlyDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
  const onlyDateTime = (v) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(v));
  // Convert YEARWEEK(ISO, mode 3) to { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
  const yearWeekToRange = (yw) => {
    const s = String(yw);
    if (!/^\d{6}$/.test(s)) return null; // e.g., 202530
    const year = parseInt(s.slice(0, 4), 10);
    const week = parseInt(s.slice(4), 10);
    if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;
    // ISO week: week 1 contains Jan 4th; Monday as first day
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Dow = jan4.getUTCDay() || 7; // Sun=7
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Dow - 1));
    const monday = new Date(mondayWeek1);
    monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const toDate = (d) => d.toISOString().slice(0, 10);
    return { from: toDate(monday), to: toDate(sunday) };
  };

  // Week-of-month label like "n월 m주" using the week's start date
  const weekOfMonthLabel = (ymd) => {
    const m = String(ymd || '');
    const m2 = m.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m2) return '';
    const y = parseInt(m2[1], 10);
    const mon = parseInt(m2[2], 10);
    const day = parseInt(m2[3], 10);
    if (!Number.isFinite(y) || !Number.isFinite(mon) || !Number.isFinite(day)) return '';
    const first = new Date(y, mon - 1, 1);
    const offset = (first.getDay() + 6) % 7; // Monday=0
    const week = Math.floor((day + offset - 1) / 7) + 1;
    return `${mon}월 ${week}주`;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      if (name === 'date') {
        // Single-day search: clear any range so daily graph responds
        return { ...prev, date: value, from: '', to: '' };
      }
      if (name === 'from' || name === 'to') {
        // Range search: clear single-day input
        return { ...prev, [name]: value, date: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  // Try to pick appropriate keys in a flexible way
  const pickKeys = (row, candidates) => {
    const keys = Object.keys(row || {});
    for (const c of candidates) {
      const found = keys.find((k) => k.toLowerCase() === c.toLowerCase());
      if (found) return found;
    }
    return keys[0];
  };

  // Fetch by filters
  useEffect(() => {
    let alive = true;
    const { date, from, to } = filters;
    const params = {};
    if (date) params.date = date;
    else if (from && to) { params.from = from; params.to = to; }

    // Type: handled by a separate effect using chartRange so it matches date chart window

    // Location: only load when ALL (no parking_idx selected)
    if (!parkingIdx) {
      setByLocation((s) => ({ ...s, loading: true, error: null }));
      getStatsByLocation(params)
        .then((rows) => {
          if (!alive) return;
          setByLocation({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
        })
        .catch((err) => alive && setByLocation({ data: [], loading: false, error: err.message || 'Failed to load' }));
    } else {
      setByLocation({ data: [], loading: false, error: null });
    }

    // Time series, filtered by date range/group if provided
    setByHour({ data: [], loading: false, error: null });
    setByDate((s) => ({ ...s, loading: true, error: null }));
    getStatsByDate({ ...params, group: granularity })
      .then((rows) => {
        if (!alive) return;
        setByDate({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByDate({ data: [], loading: false, error: err.message || 'Failed to load' }));

    return () => {
      alive = false;
    };
  }, [filters.date, filters.from, filters.to, parkingIdx, granularity]);

  // Compute actual time window shown in the date chart and sync to type chart
  useEffect(() => {
    const rows = byDate.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      setChartRange({ from: '', to: '' });
      return;
    }
    // Prefer 'bucket' for date, and 'start'/'end' when weekly
    const key = (rows[0] && ('bucket' in rows[0] ? 'bucket' : pickKeys(rows[0], ['violation_date', 'date', 'day', 'created_at']))) || 'bucket';
    let from = '';
    let to = '';
    if (granularity === 'day') {
      const list = rows.map((r) => String(r[key]).slice(0, 10));
      const last = list.slice(-7);
      from = last[0] || list[0];
      to = last[last.length - 1] || list[list.length - 1];
    } else if (granularity === 'week') {
      const first = rows[0];
      const lastRow = rows[rows.length - 1];
      from = String(first.start || '').slice(0, 10);
      to = String((lastRow && lastRow.end) || '').slice(0, 10);
      // Fallback if start/end not present: try converting YEARWEEK bucket to real dates
      if (!from || !to) {
        const toRange = (val) => {
          const raw = String(val || '');
          if (onlyDate(raw)) return { from: raw, to: raw };
          if (/^\d{6}$/.test(raw)) return yearWeekToRange(raw);
          return null;
        };
        const r1 = toRange(first && first[key]);
        const r2 = toRange(lastRow && lastRow[key]);
        from = (r1 && r1.from) || from || '';
        to = (r2 && r2.to) || to || '';
      }
    } else if (granularity === 'month') {
      const first = String(rows[0][key] || ''); // YYYY-MM
      const last = String(rows[rows.length - 1][key] || '');
      if (/^\d{4}-\d{2}$/.test(first)) {
        from = `${first}-01`;
      }
      if (/^\d{4}-\d{2}$/.test(last)) {
        const [y, m] = last.split('-').map((v) => parseInt(v, 10));
        const lastDay = new Date(y, m, 0).getDate();
        to = `${last}-${String(lastDay).padStart(2, '0')}`;
      }
      if (!from || !to) {
        // Fallback to list bounds
        const list = rows.map((r) => String(r[key]));
        from = (list[0] || '').slice(0, 10);
        to = (list[list.length - 1] || '').slice(0, 10);
      }
    }
    setChartRange({ from, to });
  }, [byDate.data, granularity]);

  // Fetch type chart according to computed chartRange to align with date chart
  useEffect(() => {
    let alive = true;
    const base = {};
    if (chartRange.from && chartRange.to) {
      base.from = chartRange.from;
      base.to = chartRange.to;
    } else if (filters.date) {
      base.date = filters.date;
    } else if (filters.from && filters.to) {
      base.from = filters.from;
      base.to = filters.to;
    }
    // Sanitize params: only allow valid date or datetime
    if (base.from && !(onlyDate(base.from) || onlyDateTime(base.from))) delete base.from;
    if (base.to && !(onlyDate(base.to) || onlyDateTime(base.to))) delete base.to;
    if ((base.from && !base.to) || (base.to && !base.from)) { delete base.from; delete base.to; }
    setByType((s) => ({ ...s, loading: true, error: null }));
    getStatsByType(base)
      .then((rows) => {
        if (!alive) return;
        setByType({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByType({ data: [], loading: false, error: err.message || 'Failed to load' }));
    return () => { alive = false; };
  }, [chartRange.from, chartRange.to, filters.date, filters.from, filters.to]);

  useEffect(() => {
    const handler = (e) => {
      const val = (e && e.detail) || (typeof localStorage !== 'undefined' ? (localStorage.getItem('parking_idx') || '') : '');
      setParkingIdx(val);
    };
    window.addEventListener('parking-change', handler);
    return () => window.removeEventListener('parking-change', handler);
  }, []);

  // Normalize datasets for charts
  const typeChart = useMemo(() => {
    const rows = byType.data;
    if (!rows?.length) return [];
    const labelKey = pickKeys(rows[0], ['violation_type', 'type']);
    const valueKey = pickKeys(rows[0], ['cnt', 'count', 'total', 'value']);
    return rows.map((r) => ({ label: String(r[labelKey]), value: Number(r[valueKey] ?? 0) }));
  }, [byType.data]);

  const dateChart = useMemo(() => {
    const rows = byDate.data;
    if (!rows?.length) return [];
    const valueKey = pickKeys(rows[0], ['cnt', 'count', 'total', 'value']);
    const key = (rows[0] && ('bucket' in rows[0] ? 'bucket' : pickKeys(rows[0], ['violation_date', 'date', 'day', 'created_at']))) || 'bucket';

    const { from, to } = filters;
    const filtered = rows.filter((r) => {
      const raw = String(r[key]);
      const dateKey = raw.length >= 10 ? raw.slice(0, 10) : raw;
      if (from && dateKey.length >= 10 && dateKey < from) return false;
      if (to && dateKey.length >= 10 && dateKey > to) return false;
      return true;
    });

    const mapped = filtered.map((r) => {
      const raw = String(r[key]);
      let label = raw;
      let meta = {};
      if (granularity === 'day') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          label = raw.slice(5);
          meta = { date: raw.slice(0, 10) };
        }
      } else if (granularity === 'month') {
        if (/^\d{4}-\d{2}$/.test(raw)) {
          label = raw.slice(5);
          const y = raw.slice(0, 4);
          const m = raw.slice(5, 7);
          const start = `${y}-${m}-01`;
          const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
          const end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
          meta = { from: start, to: end };
        }
      } else if (granularity === 'week') {
        let start = r.start;
        if (!start && r.bucket && /^\d{6}$/.test(String(r.bucket))) {
          const range = yearWeekToRange(r.bucket);
          start = range && range.from;
        }
        const wlabel = start ? weekOfMonthLabel(String(start).slice(0, 10)) : '';
        if (wlabel) label = wlabel;
        const end = r.end || (r.bucket && /^\d{6}$/.test(String(r.bucket)) ? (yearWeekToRange(r.bucket)?.to) : undefined);
        if (start && end) meta = { from: String(start).slice(0, 10), to: String(end).slice(0, 10) };
      }
      return { label, value: Number(r[valueKey] ?? 0), meta };
    });
    if (granularity === 'day' && mapped.length > 7) return mapped.slice(-7);
    return mapped;
  }, [byDate.data, filters.from, filters.to, granularity]);

  const hourChart = useMemo(() => {
    if (!filters.date) return [];
    const rows = byHour.data;
    const map = new Map();
    rows.forEach((r) => {
      const hourKey = pickKeys(r, ['hour']);
      const valueKey = pickKeys(r, ['cnt', 'count', 'total', 'value']);
      const h = Number(r[hourKey]);
      map.set(h, Number(r[valueKey] ?? 0));
    });
    const out = [];
    for (let h = 0; h < 24; h++) {
      const v = map.get(h) || 0;
      out.push({ label: `${String(h).padStart(2, '0')}:00`, value: v });
    }
    return out;
  }, [byHour.data, filters.date]);

  const locationChart = useMemo(() => {
    const rows = byLocation.data;
    if (!rows?.length) return [];
    const labelKey = pickKeys(rows[0], ['location', 'parking_loc', 'PARKING_LOC', 'camera_loc']);
    const valueKey = pickKeys(rows[0], ['cnt', 'count', 'total', 'value']);
    return rows.map((r) => ({ label: String(r[labelKey]), value: Number(r[valueKey] ?? 0) }));
  }, [byLocation.data]);

  const maxVal = (arr) => Math.max(1, ...arr.map((d) => d.value || 0));
  const sumVal = (arr) => arr.reduce((s, v) => s + (v.value || 0), 0);

  const Tooltip = ({ visible, x, y, children }) => (
    visible ? (
      <div className="chart-tooltip" style={{ left: x, top: y }}>{children}</div>
    ) : null
  );

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header">
            <h1>통계 분석</h1>
            <div className="stats-tools">
              <ParkingControls />
            </div>
          </div>
          
          <div className="statistics-content">
            
            <div className="filters">
              <label style={{ marginRight: 8 }}>From:</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
              <label style={{ margin: '0 8px' }}>To:</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />

            </div>
            <div className="charts">
              <div
                className="chart"
                onMouseMove={(e) => {
                  if (!ttType.visible) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTtType((s) => ({ ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }));
                }}
                onClick={(e) => {
                  if (e.target.closest('.bar')) return; // click empty area to clear
                  setTtType({ visible: false, x: 0, y: 0, content: null, pinned: false });
                }}
              >
                <h2>위반 유형별</h2>
                {byType.loading ? (
                  <div>Loading...</div>
                ) : byType.error ? (
                  <div>Error: {byType.error}</div>
                ) : typeChart.length === 0 ? (
                  <div>No data.</div>
                ) : (
                  <div className="bar-chart">
                    {typeChart.map((d, idx) => (
                      <div
                        key={idx}
                        className="bar"
                        style={{ height: `${Math.round((d.value / maxVal(typeChart)) * 100)}%` }}
                        onMouseEnter={(e) => {
                          const total = sumVal(typeChart);
                          const chartEl = e.currentTarget.closest('.chart');
                          const rect = (chartEl && chartEl.getBoundingClientRect()) || e.currentTarget.getBoundingClientRect();
                          setTtType({
                            visible: true,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            content: (
                              <div>
                                <div><strong>{d.label}</strong></div>
                                <div>건수: {d.value.toLocaleString()}</div>
                                <div>비율: {total ? Math.round((d.value / total) * 100) : 0}%</div>
                              </div>
                            ),
                            pinned: false,
                          });
                        }}
                        onMouseLeave={() => setTtType((s) => (s.pinned ? s : { ...s, visible: false }))}
                        onClick={(e) => {
                          e.stopPropagation();
                          const qs = new URLSearchParams();
                          if (chartRange.from) qs.set('from', chartRange.from);
                          if (chartRange.to) qs.set('to', chartRange.to);
                          if (d.label) qs.set('type', d.label);
                          qs.set('hl', 'type');
                          navigate(`/violations?${qs.toString()}`);
                        }}
                      >
                        <div className="bar-value">{d.value}</div>
                        <span>{d.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Tooltip visible={ttType.visible} x={ttType.x} y={ttType.y}>{ttType.content}</Tooltip>
              </div>
              <div
                className="chart"
                style={{ display: parkingIdx ? 'none' : undefined }}
                onMouseMove={(e) => {
                  if (!ttLoc.visible) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTtLoc((s) => ({ ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }));
                }}
                onClick={(e) => {
                  if (e.target.tagName && e.target.tagName.toLowerCase() === 'path') return;
                  setTtLoc({ visible: false, x: 0, y: 0, content: null, pinned: false });
                }}
              >
                <h2>장소별</h2>
                {byLocation.loading ? (
                  <div>Loading...</div>
                ) : byLocation.error ? (
                  <div>Error: {byLocation.error}</div>
                ) : locationChart.length === 0 ? (
                  <div>No data.</div>
                ) : (
                  <>
                    <svg className="pie-svg" viewBox="0 0 180 180">
                      {(() => {
                        const total = sumVal(locationChart) || 1;
                        const cx = 90, cy = 90, r = 80;
                        const colors = ['#e53e3e', '#4a5568', '#38a169', '#3182ce', '#dd6b20', '#805ad5', '#2b6cb0', '#d53f8c'];
                        let startAngle = -90; // start at top
                        const toRad = (deg) => (deg * Math.PI) / 180;
                        const polar = (angle) => ({ x: cx + r * Math.cos(toRad(angle)), y: cy + r * Math.sin(toRad(angle)) });
                        return locationChart.map((d, i) => {
                          const pct = d.value / total;
                          const angle = pct * 360;
                          const endAngle = startAngle + angle;
                          const largeArc = angle > 180 ? 1 : 0;
                          const p1 = polar(startAngle);
                          const p2 = polar(endAngle);
                          const dPath = [
                            `M ${cx} ${cy}`,
                            `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
                            `A ${r} ${r} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
                            'Z',
                          ].join(' ');
                          const mid = startAngle + angle / 2;
                          const labelPos = { x: cx + (r * 0.6) * Math.cos(toRad(mid)), y: cy + (r * 0.6) * Math.sin(toRad(mid)) };
                          const seg = (
                            <g key={i}>
                              <path
                                d={dPath}
                                fill={colors[i % colors.length]}
                                onMouseEnter={(e) => {
                                  const chartEl = e.currentTarget.closest('.chart');
                                  const rect = (chartEl && chartEl.getBoundingClientRect()) || e.currentTarget.getBoundingClientRect();
                                  setTtLoc({
                                    visible: true,
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                    content: (
                                      <div>
                                        <div><strong>{d.label}</strong></div>
                                        <div>건수: {d.value.toLocaleString()}</div>
                                        <div>비율: {Math.round(pct * 100)}%</div>
                                      </div>
                                    ),
                                    pinned: false,
                                  });
                                }}
                                onMouseLeave={() => setTtLoc((s) => (s.pinned ? s : { ...s, visible: false }))}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTtLoc((s) => ({ ...s, pinned: !s.pinned, visible: true }));
                                }}
                              />
                              {pct > 0.07 && (
                                <text x={labelPos.x} y={labelPos.y} fill="#fff" fontSize="11" textAnchor="middle" dominantBaseline="middle">
                                  {d.value}
                                </text>
                              )}
                            </g>
                          );
                          startAngle = endAngle;
                          return seg;
                        });
                      })()}
                    </svg>
                    <div className="legend">
                      {locationChart.map((d, i) => {
                        const colors = ['#e53e3e', '#4a5568', '#38a169', '#3182ce', '#dd6b20', '#805ad5', '#2b6cb0', '#d53f8c'];
                        return (
                          <div className="legend-item" key={i}>
                            <span className="legend-color" style={{ backgroundColor: colors[i % colors.length] }} />
                            <span>{d.label}: {d.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                <Tooltip visible={ttLoc.visible} x={ttLoc.x} y={ttLoc.y}>{ttLoc.content}</Tooltip>
              </div>
              <div className="chart">
                <h2>{granularity === 'day' ? '일별' : granularity === 'week' ? '주별' : '월별'}</h2>
                {(() => {
                  const loading = byDate.loading;
                  const error = byDate.error;
                  const data = dateChart;
                  if (loading) return <div>Loading...</div>;
                  if (error) return <div>Error: {error}</div>;
                  if (!data.length) return <div>No data.</div>;
                  const max = maxVal(data);
                  const W = 600, H = 200, P = 20; // width, height, padding
                  const toX = (i) => {
                    const n = Math.max(1, data.length - 1);
                    return P + (i * (W - 2 * P)) / n;
                  };
                  const toY = (v) => {
                    const ratio = max ? v / max : 0;
                    return H - P - ratio * (H - 2 * P);
                  };
                  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
                  return (
                    <svg
                      className="line-chart"
                      viewBox={`0 0 ${W} ${H}`}
                      onMouseMove={(e) => {
                        if (!ttDate.visible) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTtDate((s) => ({ ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }));
                      }}
                      onClick={() => setTtDate({ visible: false, x: 0, y: 0, content: null, pinned: false })}
                    >
                      <polyline className="line-path" points={points} />
                      {data.map((d, i) => (
                        <g key={i} className="line-point">
                          <circle
                            cx={toX(i)}
                            cy={toY(d.value)}
                            r="3.5"
                            onMouseEnter={(e) => {
                              const total = sumVal(data);
                              const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                              setTtDate({
                                visible: true,
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top,
                                content: (
                                  <div>
                                    <div><strong>{d.label}</strong></div>
                                    <div>건수: {d.value.toLocaleString()}</div>
                                    <div>비율: {total ? Math.round((d.value / total) * 100) : 0}%</div>
                                  </div>
                                ),
                                pinned: false,
                              });
                            }}
                            onMouseLeave={() => setTtDate((s) => (s.pinned ? s : { ...s, visible: false }))}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to violations filtered by the selected time bucket
                              const qs = new URLSearchParams();
                              if (granularity === 'day' && d.meta?.date) {
                                qs.set('date', d.meta.date);
                                qs.set('hl', 'date');
                              } else if (granularity === 'week' && d.meta?.from && d.meta?.to) {
                                qs.set('from', d.meta.from);
                                qs.set('to', d.meta.to);
                                qs.set('hl', 'range');
                              } else if (granularity === 'month' && d.meta?.from && d.meta?.to) {
                                qs.set('from', d.meta.from);
                                qs.set('to', d.meta.to);
                                qs.set('hl', 'range');
                              }
                              navigate(`/violations?${qs.toString()}`);
                              setTtDate((s) => ({ ...s, pinned: !s.pinned, visible: true }));
                            }}
                      />
                      <text x={toX(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#cbd5e1">{d.label}</text>
                    </g>
                  ))}
                </svg>
              );
            })()}
            <Tooltip visible={ttDate.visible} x={ttDate.x} y={ttDate.y}>{ttDate.content}</Tooltip>
            <div className="granularity-toggle" role="group" aria-label="Time grouping" style={{ marginTop: 10 }}>
              <button type="button" className={granularity === 'day' ? 'toggle active' : 'toggle'} aria-pressed={granularity === 'day'} onClick={() => setGranularity('day')}>일별</button>
              <button type="button" className={granularity === 'week' ? 'toggle active' : 'toggle'} aria-pressed={granularity === 'week'} onClick={() => setGranularity('week')}>주별</button>
              <button type="button" className={granularity === 'month' ? 'toggle active' : 'toggle'} aria-pressed={granularity === 'month'} onClick={() => setGranularity('month')}>월별</button>
            </div>
          </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
