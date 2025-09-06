import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/mainpage.css';
import '../style/StatisticsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import { getStatsByType, getStatsByDate, getStatsByHour, getStatsByWeekday, exportStatsCSV, exportStatsExcel } from '../services/api';
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
  const [byWeekday, setByWeekday] = useState({ data: [], loading: true, error: null });
  const [parkingIdx, setParkingIdx] = useState(() => (typeof localStorage !== 'undefined' ? (localStorage.getItem('parking_idx') || '') : ''));
  const [ttType, setTtType] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [ttDate, setTtDate] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [ttWeekday, setTtWeekday] = useState({ visible: false, x: 0, y: 0, content: null, pinned: false });
  const [granularity, setGranularity] = useState('day');
  const [chartRange, setChartRange] = useState({ from: '', to: '' });
  const [typeChartMode, setTypeChartMode] = useState('bar'); // 'bar' or 'pie'
  const [csvDropdownVisible, setCsvDropdownVisible] = useState(false);
  const [csvExportOptions, setCsvExportOptions] = useState({
    'by-type': true,
    'by-date': true,
    'by-weekday': true
  });
  const [csvDownloading, setCsvDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const navigate = useNavigate();

  // Export handlers
  const handleCsvOptionChange = (option) => {
    setCsvExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleCsvExportConfirm = async () => {
    const selectedTypes = Object.keys(csvExportOptions).filter(key => csvExportOptions[key]);
    
    if (selectedTypes.length === 0) {
      alert('최소 하나의 항목을 선택해주세요.');
      return;
    }

    setCsvDownloading(true);
    setDownloadProgress({ current: 0, total: selectedTypes.length });

    const exportParams = {};
    if (filters.from) exportParams.from = filters.from;
    if (filters.to) exportParams.to = filters.to;
    if (parkingIdx) exportParams.parking_idx = parkingIdx;

    try {
      // 선택된 각 타입별로 CSV 다운로드 (지연을 두어 순차 실행)
      for (let i = 0; i < selectedTypes.length; i++) {
        const type = selectedTypes[i];
        setDownloadProgress({ current: i + 1, total: selectedTypes.length });
        
        const params = { ...exportParams, type };
        exportStatsCSV(params);
        
        // 마지막 다운로드가 아니라면 500ms 지연
        if (i < selectedTypes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('CSV 다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setCsvDownloading(false);
      setCsvDropdownVisible(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleExportExcel = () => {
    const exportParams = {};
    if (filters.from) exportParams.from = filters.from;
    if (filters.to) exportParams.to = filters.to;
    if (parkingIdx) exportParams.parking_idx = parkingIdx;
    exportStatsExcel(exportParams);
  };

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


    // Time series, filtered by date range/group if provided
    setByDate((s) => ({ ...s, loading: true, error: null }));
    getStatsByDate({ ...params, group: granularity })
      .then((rows) => {
        if (!alive) return;
        setByDate({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByDate({ data: [], loading: false, error: err.message || 'Failed to load' }));

    // Fetch hourly data when a specific date is selected
    if (date) {
      setByHour({ data: [], loading: true, error: null });
      getStatsByHour({ date })
        .then((rows) => {
          if (!alive) return;
          setByHour({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
        })
        .catch((err) => alive && setByHour({ data: [], loading: false, error: err.message || 'Failed to load' }));
    } else {
      setByHour({ data: [], loading: false, error: null });
    }

    // Weekday stats
    setByWeekday((s) => ({ ...s, loading: true, error: null }));
    getStatsByWeekday(params)
      .then((rows) => {
        if (!alive) return;
        setByWeekday({ data: Array.isArray(rows) ? rows : [], loading: false, error: null });
      })
      .catch((err) => alive && setByWeekday({ data: [], loading: false, error: err.message || 'Failed to load' }));

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (csvDropdownVisible && !event.target.closest('.csv-export-dropdown')) {
        setCsvDropdownVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [csvDropdownVisible]);

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
    if (granularity === 'day') {
      // Build last 7 days window ending at filters.to or today
      const end = (() => {
        const base = (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) ? new Date(filters.to) : new Date();
        // normalize to local midnight
        return new Date(base.getFullYear(), base.getMonth(), base.getDate());
      })();
      const toISO = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const valueByDate = new Map();
      mapped.forEach((d) => { if (d.meta && d.meta.date) valueByDate.set(d.meta.date, Number(d.value || 0)); });
      const out = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        const iso = toISO(d);
        out.push({ label: iso.slice(5), value: valueByDate.get(iso) || 0, meta: { date: iso } });
      }
      return out;
    }
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
          <div className="header with-controls">
            <h1>통계 분석</h1>
            <div className="stats-tools">
              <ParkingControls />
            </div>
          </div>
          
          <div className="statistics-content">
            
            <div className="filters">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <label style={{ marginRight: 8 }}>From:</label>
                <input type="date" name="from" value={filters.from} onChange={handleFilterChange} />
                <label style={{ margin: '0 8px' }}>To:</label>
                <input type="date" name="to" value={filters.to} onChange={handleFilterChange} />
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <div className="csv-export-dropdown">
                    <button 
                      type="button" 
                      onClick={() => setCsvDropdownVisible(!csvDropdownVisible)}
                      className="export-button"
                      title="CSV 파일로 내보내기"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📊 CSV 내보내기 ▼
                    </button>
                    {csvDropdownVisible && (
                      <div className="csv-export-menu">
                        <div className="csv-export-option">
                          <input
                            type="checkbox"
                            id="csv-by-type"
                            checked={csvExportOptions['by-type']}
                            onChange={() => handleCsvOptionChange('by-type')}
                          />
                          <label htmlFor="csv-by-type">위반 유형별 통계</label>
                        </div>
                        <div className="csv-export-option">
                          <input
                            type="checkbox"
                            id="csv-by-date"
                            checked={csvExportOptions['by-date']}
                            onChange={() => handleCsvOptionChange('by-date')}
                          />
                          <label htmlFor="csv-by-date">날짜별 통계</label>
                        </div>
                        <div className="csv-export-option">
                          <input
                            type="checkbox"
                            id="csv-by-weekday"
                            checked={csvExportOptions['by-weekday']}
                            onChange={() => handleCsvOptionChange('by-weekday')}
                          />
                          <label htmlFor="csv-by-weekday">요일별 통계</label>
                        </div>
                        {csvDownloading && (
                          <div className="csv-download-progress">
                            <div className="progress-text">
                              다운로드 중... ({downloadProgress.current}/{downloadProgress.total})
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ 
                                  width: `${(downloadProgress.current / downloadProgress.total) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="csv-export-actions">
                          <button
                            type="button"
                            className="csv-export-confirm"
                            onClick={handleCsvExportConfirm}
                            disabled={csvDownloading}
                          >
                            {csvDownloading ? '다운로드 중...' : '확인'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={handleExportExcel}
                    className="export-button"
                    title="Excel 파일로 내보내기"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    📈 Excel 내보내기
                  </button>
                </div>
              </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2>위반 유형별</h2>
                  <div className="chart-toggle" role="group" aria-label="Chart type">
                    <button
                      type="button"
                      className={typeChartMode === 'bar' ? 'toggle active' : 'toggle'}
                      aria-pressed={typeChartMode === 'bar'}
                      onClick={() => setTypeChartMode('bar')}
                      title="막대 차트"
                    >
                      막대
                    </button>
                    <button
                      type="button"
                      className={typeChartMode === 'pie' ? 'toggle active' : 'toggle'}
                      aria-pressed={typeChartMode === 'pie'}
                      onClick={() => setTypeChartMode('pie')}
                      title="파이 차트"
                    >
                      파이
                    </button>
                  </div>
                </div>
                {byType.loading ? (
                  <div>Loading...</div>
                ) : byType.error ? (
                  <div>Error: {byType.error}</div>
                ) : typeChart.length === 0 ? (
                  <div>No data.</div>
                ) : typeChartMode === 'pie' ? (
                  // Pie Chart Implementation
                  <div className="pie-chart-container" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <svg 
                      className="pie-svg" 
                      viewBox="0 0 300 300" 
                      style={{ width: '300px', height: '300px', flex: '0 0 300px' }}
                    >
                      {(() => {
                        const total = sumVal(typeChart);
                        if (total === 0) return null;
                        
                        let currentAngle = -Math.PI / 2; // Start from top
                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];
                        
                        return typeChart.map((d, idx) => {
                          const percentage = d.value / total;
                          const angle = percentage * 2 * Math.PI;
                          const endAngle = currentAngle + angle;
                          
                          const largeArcFlag = angle > Math.PI ? 1 : 0;
                          const x1 = 150 + 120 * Math.cos(currentAngle);
                          const y1 = 150 + 120 * Math.sin(currentAngle);
                          const x2 = 150 + 120 * Math.cos(endAngle);
                          const y2 = 150 + 120 * Math.sin(endAngle);
                          
                          const path = percentage === 1 
                            ? `M 150,150 L 150,30 A 120,120 0 1,1 149.9,30 Z`
                            : `M 150,150 L ${x1},${y1} A 120,120 0 ${largeArcFlag},1 ${x2},${y2} Z`;
                          
                          const midAngle = currentAngle + angle / 2;
                          const labelX = 150 + 140 * Math.cos(midAngle);
                          const labelY = 150 + 140 * Math.sin(midAngle);
                          
                          const slice = (
                            <g key={idx}>
                              <path
                                d={path}
                                fill={colors[idx % colors.length]}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.closest('.chart').getBoundingClientRect();
                                  setTtType({
                                    visible: true,
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top,
                                    content: (
                                      <div>
                                        <div><strong>{d.label}</strong></div>
                                        <div>건수: {d.value.toLocaleString()}</div>
                                        <div>비율: {Math.round(percentage * 100)}%</div>
                                      </div>
                                    ),
                                    pinned: false,
                                  });
                                }}
                                onMouseLeave={() => setTtType((s) => (s.pinned ? s : { ...s, visible: false }))}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (d.value === 0) return;
                                  const qs = new URLSearchParams();
                                  if (chartRange.from) qs.set('from', chartRange.from);
                                  if (chartRange.to) qs.set('to', chartRange.to);
                                  if (d.label) qs.set('type', d.label);
                                  qs.set('hl', 'type');
                                  const url = `/violations?${qs.toString()}`;
                                  navigate(url);
                                }}
                              />
                              {/* Removed inline % labels on pie slices (hover tooltip is sufficient) */}
                            </g>
                          );
                          
                          currentAngle = endAngle;
                          return slice;
                        });
                      })()}
                    </svg>
                    <div className="pie-legend">
                      {typeChart.map((d, idx) => {
                        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'];
                        const total = sumVal(typeChart);
                        return (
                          <div key={idx} className="legend-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <div 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                backgroundColor: colors[idx % colors.length], 
                                marginRight: '8px',
                                borderRadius: '2px'
                              }} 
                            />
                            <span style={{ fontSize: '14px' }}>
                              {d.label}: {d.value.toLocaleString()}건
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Bar Chart Implementation (existing)
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
                          if (d.value === 0) return;
                          const qs = new URLSearchParams();
                          if (chartRange.from) qs.set('from', chartRange.from);
                          if (chartRange.to) qs.set('to', chartRange.to);
                          if (d.label) qs.set('type', d.label);
                          qs.set('hl', 'type');
                          const url = `/violations?${qs.toString()}`;
                          navigate(url);
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
              <div className="chart">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h2>
                    {filters.date 
                      ? `선택된 날짜: ${filters.date}` 
                      : (granularity === 'day' ? '일별' : granularity === 'week' ? '주별' : '월별')
                    }
                  </h2>
                  {filters.date && (
                    <button 
                      type="button" 
                      className="toggle" 
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          date: '',
                          from: prev.from || '',
                          to: prev.to || new Date().toISOString().slice(0, 10)
                        }));
                      }}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      ← 범위 보기로 돌아가기
                    </button>
                  )}
                </div>
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
                              if (d.value === 0) return; // 0건인 점은 클릭 무시
                              
                              if (granularity === 'day' && d.meta?.date) {
                                // For day granularity, update the filters to show only this day
                                // This will trigger the hourly chart and filter the search results
                                setFilters(prev => ({
                                  ...prev,
                                  date: d.meta.date,
                                  from: '',
                                  to: ''
                                }));
                                
                                // Also navigate to violations page with the selected date
                                const qs = new URLSearchParams();
                                qs.set('date', d.meta.date);
                                qs.set('hl', 'date');
                                const url = `/violations?${qs.toString()}`;
                                console.log('[StatisticsPage] 일별 차트 클릭 - 선택된 날짜:', d.meta.date);
                                console.log('[StatisticsPage] 이동 URL:', url);
                                navigate(url);
                              } else {
                                // For week/month granularity, navigate to violations filtered by the selected time bucket
                                const qs = new URLSearchParams();
                                if (granularity === 'week' && d.meta?.from && d.meta?.to) {
                                  qs.set('from', d.meta.from);
                                  qs.set('to', d.meta.to);
                                  qs.set('hl', 'range');
                                } else if (granularity === 'month' && d.meta?.from && d.meta?.to) {
                                  qs.set('from', d.meta.from);
                                  qs.set('to', d.meta.to);
                                  qs.set('hl', 'range');
                                }
                                const url = `/violations?${qs.toString()}`;
                                console.log('[StatisticsPage] 차트 클릭 - 시간대:', granularity, d.meta);
                                console.log('[StatisticsPage] 이동 URL:', url);
                                navigate(url);
                              }
                              
                              setTtDate((s) => ({ ...s, pinned: !s.pinned, visible: true }));
                            }}
                      />
                      {/* Value above point */}
                      <text
                        x={toX(i)}
                        y={Math.max(10, toY(d.value) - 8)}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--text-body)"
                        style={{ pointerEvents: 'none' }}
                      >
                        {d.value}
                      </text>
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

          {/* 요일별 위반 분석 차트 (주별/월별 보기에서만 표시) */}
          {(granularity === 'week' || granularity === 'month') && (
            <div
            className="chart"
            onMouseMove={(e) => {
              if (!ttWeekday.visible) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setTtWeekday((s) => ({ ...s, x: e.clientX - rect.left, y: e.clientY - rect.top }));
            }}
            onClick={(e) => {
              if (e.target.closest('.bar')) return;
              setTtWeekday({ visible: false, x: 0, y: 0, content: null, pinned: false });
            }}
          >
            <h2>요일별 위반 분석</h2>
            {byWeekday.loading ? (
              <div>Loading...</div>
            ) : byWeekday.error ? (
              <div>Error: {byWeekday.error}</div>
            ) : byWeekday.data.length === 0 ? (
              <div>No data.</div>
            ) : (
              <div className="bar-chart">
                {byWeekday.data.map((d, idx) => {
                  const total = byWeekday.data.reduce((sum, item) => sum + item.count, 0);
                  const max = Math.max(...byWeekday.data.map(item => item.count));
                  const pct = max > 0 ? (d.count / max) * 100 : 0;
                  const isWeekend = d.dayIndex === 1 || d.dayIndex === 7; // 일요일(1), 토요일(7)
                  return (
                    <div
                      key={idx}
                      className={`bar ${isWeekend ? 'weekend' : 'weekday'}`}
                      style={{ height: `${pct}%` }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.closest('.chart').getBoundingClientRect();
                        setTtWeekday({
                          visible: true,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                          content: (
                            <div>
                              <div><strong>{d.weekday}</strong></div>
                              <div>위반 건수: {d.count.toLocaleString()}</div>
                              <div>비율: {total ? Math.round((d.count / total) * 100) : 0}%</div>
                              <div style={{ fontSize: '0.85em', color: '#64748b', marginTop: 4 }}>
                                {isWeekend ? '주말' : '평일'}
                              </div>
                            </div>
                          ),
                          pinned: false,
                        });
                      }}
                      onMouseLeave={() => setTtWeekday((s) => (s.pinned ? s : { ...s, visible: false }))}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (d.count === 0) return;
                        
                        // 요일별 차트는 클릭해도 리다이렉트하지 않음
                        // 대신 툴팁만 고정/해제
                        setTtWeekday((s) => ({ ...s, pinned: !s.pinned, visible: true }));
                      }}
                    >
                      <div className="bar-label">{d.weekday}</div>
                      <div className="bar-value">{d.count}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <Tooltip visible={ttWeekday.visible} x={ttWeekday.x} y={ttWeekday.y}>{ttWeekday.content}</Tooltip>
          </div>
          )}

          {/* 시간대별 위반 분석 차트 (단일 날짜 선택 시에만 표시) */}
          {filters.date && (
            <div className="chart">
              <h2>시간대별 위반 분석 ({filters.date})</h2>
              {byHour.loading ? (
                <div>Loading...</div>
              ) : byHour.error ? (
                <div>Error: {byHour.error}</div>
              ) : hourChart.length === 0 ? (
                <div>No data.</div>
              ) : (
                <div className="bar-chart">
                  {hourChart.map((d, idx) => {
                    const max = Math.max(...hourChart.map(item => item.value));
                    const pct = max > 0 ? (d.value / max) * 100 : 0;
                    const hour = parseInt(d.label.split(':')[0]);
                    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) || (hour >= 12 && hour <= 13);
                    
                    return (
                      <div
                        key={idx}
                        className={`bar ${isPeakHour ? 'peak-hour' : ''}`}
                        style={{ height: `${pct}%` }}
                        title={`${d.label}: ${d.value}건`}
                      >
                        <div className="bar-label">{d.label}</div>
                        <div className="bar-value">{d.value}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default StatisticsPage;
