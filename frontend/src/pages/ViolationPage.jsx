import React, { useState, useEffect } from 'react';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ParkingControls from '../component/ParkingControls';

const ViolationPage = () => {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const sampleViolations = [
      { carNumber: '12가3456', type: '불법 주정차', date: '2025-08-28T10:00:00' },
      { carNumber: '34나5678', type: '신호 위반', date: '2025-08-28T11:30:00' },
      { carNumber: '56다7890', type: '과속', date: '2025-08-28T12:15:00' },
    ];
    setViolations(sampleViolations);
  }, []);

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header">
            <h1>위반차량 정보</h1>
            <div className="notif-tools">
              <ParkingControls />
            </div>
          </div>
          <div className="violation-list">
            <table>
              <thead>
                <tr>
                  <th>차량번호</th>
                  <th>위반내용</th>
                  <th>위반일시</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((violation, index) => (
                  <tr key={index}>
                    <td>{violation.carNumber}</td>
                    <td>{violation.type}</td>
                    <td>{new Date(violation.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationPage;

