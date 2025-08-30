import React, { useEffect, useState } from 'react';
import '../style/mainpage.css';
import disabled from "../assets/disabled.png";
import parking from "../assets/parking.png";
import notcar from "../assets/notcar.png";
import { getDashboardSummary } from '../services/api';

const StatBox = ({ icon, title, value, total, valueColor, loading }) => (
  <div className='stat-box'>
    <img src={icon} alt={title} style={{ width: "80px", height: "80px", filter: 'brightness(0) invert(1)' }} />
    <div className="stat-box-main">
      <div style={{ fontSize: "24px", fontFamily: "'Pretendard Variable', sans-serif" }}>{title}</div>
      <div>
        <span style={{ fontSize: "36px", color: valueColor, fontWeight: "900" }}>
          {value}
        </span>
        {!loading && typeof total === 'number' && total > 0 && (
          <span style={{ color: "white", fontSize: "20px", fontWeight:"100" }}> / {total}</span>
        )}
      </div>
    </div>
  </div>
);

const StatisticsBox = () => {
  const [summary, setSummary] = useState({
    disabledParking: { current: 0, total: 0 },
    generalParking: { current: 0, total: 0 },
    todayViolations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
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
    return () => {
      mounted = false;
    };
  }, []);

  const d = summary?.disabledParking || { current: 0, total: 0 };
  const g = summary?.generalParking || { current: 0, total: 0 };
  const disabledAvail = Math.max(0, (d.total || 0) - (d.current || 0));
  const generalAvail = Math.max(0, (g.total || 0) - (g.current || 0));

  return (
    <div className="stats-container box-style">
      <StatBox icon={disabled} title="장애인 잔여" value={disabledAvail} total={d.total} valueColor="#68D391" loading={loading} />
      <StatBox icon={parking} title="일반 잔여" value={generalAvail} total={g.total} valueColor="#63B3ED" loading={loading} />
      <StatBox icon={notcar} title="금일 위반" value={summary.todayViolations} valueColor="#E53E3E" loading={loading} />
    </div>
  );
};

export default StatisticsBox;
