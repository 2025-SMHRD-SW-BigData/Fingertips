import React from 'react';
import '../style/mainpage.css';
import '../style/dashboard.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import MapWidget from '../component/MapWidget';
import Main_inout from '../component/Main_inout';
import Mainpage_vio from '../component/Mainpage_vio';
import StatisticsBox from '../component/StatisticsBox';
import SidebarLayout from '../ui/SidebarLayout';

export default function DashboardV2() {
  return (
    <SidebarLayout className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop showParkingControls />
        <Sidebar />
        <div className="content-area">
          <section id="dashboard" className="view active" aria-label="dashboard">
            <StatisticsBox />

            <div className="dashboard-grid">
              {/* Row 1: Map + In/Out unified (no gap) */}
              <div className="map-inout-container">
                <div className="map-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>주차장 지도</div>
                    <div className="hint">상태: 가용 초록 · 사용중 빨강</div>
                  </div>
                  <MapWidget />
                </div>
                <div className="inout-section">
                  <Main_inout />
                </div>
              </div>

              {/* Row 2: Recent Violations spanning both columns */}
              <Mainpage_vio showStatus showAction className="span-2" />
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
