import React, { useState } from 'react';
import '../style/mainpage.css';
import '../style/SettingsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import SidebarLayout from '../ui/SidebarLayout';
import { useTheme } from '../theme/ThemeProvider';

const SettingsPage = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    realtimeAlerts: true,
    dailyReports: false,
    reportTime: '09:00',
  });

  const [cctvSettings, setCctvSettings] = useState({
    retentionPeriod: '15',
    motionSensitivity: 'medium',
  });

  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCctvChange = (e) => {
    const { name, value } = e.target;
    setCctvSettings((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <SidebarLayout className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <h1>설정</h1>
          <div className="settings-container">
            <div className="settings-section">
              <h2>테마</h2>
              <div className="setting-item">
                <label>Light Mode</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={isLight}
                    onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
            <div className="settings-section">
              <h2>알림 설정</h2>
              <div className="setting-item">
                <label>실시간 위반 알림</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="realtimeAlerts"
                    checked={notificationSettings.realtimeAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              <div className="setting-item">
                <label>일일 리포트 수신</label>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="dailyReports"
                    checked={notificationSettings.dailyReports}
                    onChange={handleNotificationChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
              {notificationSettings.dailyReports && (
                <div className="setting-item">
                  <label>리포트 수신 시간</label>
                  <input
                    type="time"
                    name="reportTime"
                    value={notificationSettings.reportTime}
                    onChange={handleNotificationChange}
                  />
                </div>
              )}
            </div>

            <div className="settings-section">
              <h2>CCTV 설정</h2>
              <div className="setting-item">
                <label>영상 보관 기간</label>
                <select
                  name="retentionPeriod"
                  value={cctvSettings.retentionPeriod}
                  onChange={handleCctvChange}
                >
                  <option value="7">7일</option>
                  <option value="15">15일</option>
                  <option value="30">30일</option>
                </select>
              </div>
              <div className="setting-item">
                <label>움직임 감지 민감도</label>
                <select
                  name="motionSensitivity"
                  value={cctvSettings.motionSensitivity}
                  onChange={handleCctvChange}
                >
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SettingsPage;
