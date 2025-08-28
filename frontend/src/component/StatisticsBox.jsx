import React, { useEffect, useState } from 'react';
import '../style/mainpage.css';
import disabled from "../assets/disabled.png";
import parking from "../assets/parking.png";
import notcar from "../assets/notcar.png";
import { getDashboardSummary } from '../services/api';

const StatBox = ({ icon, title, value, total, valueColor }) => (
  <div className='stat-box'>
    <img src={icon} alt={title} style={{ width: "80px", height: "80px", filter: 'brightness(0) invert(1)' }} />
    <div className="stat-box-main">
      <div style={{ fontSize: "24px", fontFamily: "'Pretendard Variable', sans-serif" }}>{title}</div>
      <div>
        <span style={{ fontSize: "36px", color: valueColor, fontWeight: "900" }}>{value}</span>
        {typeof total === 'number' && <span style={{ color: "white", fontSize: "20px", fontWeight:"100" }}> / {total}</span>}
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

  useEffect(() => {
    let mounted = true;
    getDashboardSummary()
      .then((data) => {
        if (mounted && data) setSummary(data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard summary', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="stats-container box-style">
      <StatBox icon={disabled} title="장애인 주차" value={summary.disabledParking.current} total={summary.disabledParking.total} valueColor="#68D391" />
      <StatBox icon={parking} title="일반 차량" value={summary.generalParking.current} total={summary.generalParking.total} valueColor="#63B3ED" />
      <StatBox icon={notcar} title="금일 위반" value={summary.todayViolations} valueColor="#E53E3E" />
    </div>
  );
};

export default StatisticsBox;

