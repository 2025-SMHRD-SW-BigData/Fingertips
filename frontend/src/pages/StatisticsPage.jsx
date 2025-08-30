import React, { useEffect, useMemo, useState } from 'react';
import '../style/mainpage.css';
import '../style/StatisticsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import { getStatsByType, getStatsByDate, getStatsByLocation, getStatsByHour } from '../services/api';

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
    if (from) params.from = from;
    if (to) params.to = to;

    // Type
    setByType((s) => ({ ...s, loading: true, error: null }));
    getStatsByType(params)
      .then((rows) => {
        if (!alive) return;
        setByType({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByType({ data: [], loading: false, error: err.message || 'Failed to load' }));

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

    // Always use daily time series, filtered by date range if provided
    setByHour({ data: [], loading: false, error: null });
    setByDate((s) => ({ ...s, loading: true, error: null }));
    getStatsByDate(params)
      .then((rows) => {
        if (!alive) return;
        setByDate({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByDate({ data: [], loading: false, error: err.message || 'Failed to load' }));

    return () => {
      alive = false;
    };
  }, [filters.date, filters.from, filters.to, parkingIdx]);

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
    const labelKey = pickKeys(rows[0], ['violation_date', 'date', 'day', 'created_at']);
    const valueKey = pickKeys(rows[0], ['cnt', 'count', 'total', 'value']);

    const { from, to } = filters;
    const filteredRows = rows.filter(r => {
      const rowDate = String(r[labelKey]).slice(0, 10);
      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    });

    return filteredRows.map((r) => ({ label: String(r[labelKey]).slice(0, 10), value: Number(r[valueKey] ?? 0) }));
  }, [byDate.data, filters.from, filters.to]);

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
          <h1>통계 분석</h1>
          <div className="statistics-content">
            <div className="filters">
              <label style={{ marginRight: 8 }}>From:</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
              <label style={{ margin: '0 8px' }}>To:</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />
              <select name="place" value={filters.place} onChange={handleFilterChange}>
                <option value="">장소 선택</option>
                <option value="entrance">출구</option>
                <option value="parking_lot">주차장</option>
                <option value="disabled_area">장애인구역</option>
              </select>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">위반 유형 선택</option>
                <option value="illegal_parking">불법 주정차</option>
                <option value="speeding">과속</option>
                <option value="signal_violation">신호 위반</option>
              </select>
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
                          setTtType((s) => ({ ...s, pinned: !s.pinned, visible: true }));
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
                <h2>{filters.date ? '시간별' : '일자별'}</h2>
                {(() => {
                  const loading = byDate.loading;
                  const error = byDate.error;
                  const data = dateChart;
                  if (loading) return <div>Loading...</div>;
                  if (error) return <div>Error: {error}</div>;
                  if (!data.length) return <div>No data.</div>;
                  const max = maxVal(data);
                  return (
                    <div
                      className="bar-chart"
                      onMouseMove={(e) => {
                        if (!ttDate.visible) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTtDate((s) => ({ ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }));
                      }}
                      onClick={(e) => {
                        if (e.target.closest('.bar')) return;
                        setTtDate({ visible: false, x: 0, y: 0, content: null, pinned: false });
                      }}
                    >
                      {data.map((d, idx) => (
                        <div
                          key={idx}
                          className="bar"
                          style={{ height: `${Math.round((d.value / max) * 100)}%`, width: '20px' }}
                          onMouseEnter={(e) => {
                            const total = sumVal(data);
                            const chartEl = e.currentTarget.closest('.chart');
                            const rect = (chartEl && chartEl.getBoundingClientRect()) || e.currentTarget.getBoundingClientRect();
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
                            setTtDate((s) => ({ ...s, pinned: !s.pinned, visible: true }));
                          }}
                        >
                          <div className="bar-value">{d.value}</div>
                          <span>{d.label}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <Tooltip visible={ttDate.visible} x={ttDate.x} y={ttDate.y}>{ttDate.content}</Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
