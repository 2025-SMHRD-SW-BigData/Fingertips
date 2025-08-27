import React from 'react';
import '../style/mainpage.css';
import disabled from "../assets/disabled.png";
import parking from "../assets/parking.png";
import notcar from "../assets/notcar.png";

const StatBox = ({ icon, title, value, total, valueColor }) => (
  <div className='stat-box'>
    <img src={icon} alt={title} style={{ width: "80px", height: "80px", filter: 'brightness(0) invert(1)' }} />
    <div className="stat-box-main">
      <div style={{ fontSize: "24px", fontFamily: "'Pretendard Variable', sans-serif" }}>{title}</div>
      <div>
        <span style={{ fontSize: "36px", color: valueColor, fontWeight: "900" }}>{value}</span>
        {total && <span style={{ color: "white", fontSize: "20px", fontWeight:"100" }}> / {total}</span>}
      </div>
    </div>
  </div>
);

const StatisticsBox = () => {
  return (
    <div className="stats-container box-style">
      <StatBox icon={disabled} title="장애인차량" value={1} total={3} valueColor="#68D391" />
      <StatBox icon={parking} title="일반차량" value={30} total={50} valueColor="#63B3ED" />
      <StatBox icon={notcar} title="위반차량" value={7} valueColor="#E53E3E" />
    </div>
  );
};

export default StatisticsBox;
