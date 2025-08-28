import React, { useState } from 'react';
import '../style/mainpage.css';
import '../style/StatisticsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';

const StatisticsPage = () => {
  const [filters, setFilters] = useState({
    date: '',
    place: '',
    type: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

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
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
              />
              <select name="place" value={filters.place} onChange={handleFilterChange}>
                <option value="">장소 선택</option>
                <option value="entrance">입구</option>
                <option value="parking_lot">주차장</option>
                <option value="disabled_area">장애인 구역</option>
              </select>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">위반 유형 선택</option>
                <option value="illegal_parking">불법 주정차</option>
                <option value="speeding">과속</option>
                <option value="signal_violation">신호 위반</option>
              </select>
            </div>
            <div className="charts">
              <div className="chart">
                <h2>위반 유형별 통계</h2>
                <div className="bar-chart">
                  <div className="bar" style={{ height: '60%' }}><span>불법 주정차</span></div>
                  <div className="bar" style={{ height: '30%' }}><span>과속</span></div>
                  <div className="bar" style={{ height: '10%' }}><span>신호 위반</span></div>
                </div>
              </div>
              <div className="chart">
                <h2>장소별 통계</h2>
                <div className="pie-chart"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;