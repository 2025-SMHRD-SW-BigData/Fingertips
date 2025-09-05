import React, { useEffect, useState } from 'react';
import '../style/mainpage.css';
import disabled from "../assets/disabled.png";
import parking from "../assets/parking.png";
import notcar from "../assets/notcar.png";
import { getDashboardSummary } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

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

  const d = summary?.disabledParking || { current: 0, total: 0 };
  const g = summary?.generalParking || { current: 0, total: 0 };
  const disabledAvail = Math.max(0, (d.total || 0) - (d.current || 0));
  const generalAvail = Math.max(0, (g.total || 0) - (g.current || 0));

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
