import React, { useState } from 'react';
import '../style/mainpage.css';
import '../style/SettingsPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    siteTitle: '이음 주차',
    emailNotifications: true,
    pushNotifications: false,
  });

  const [users, setUsers] = useState([
    { id: 1, name: '관리자', email: 'admin@example.com', role: 'Super Admin' },
    { id: 2, name: '부관리자', email: 'subadmin@example.com', role: 'Admin' },
  ]);

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <h1>설정</h1>
          <div className="settings-content">
            <div className="settings-section">
              <h2>일반 설정</h2>
              <label>
                사이트 제목:
                <input
                  type="text"
                  name="siteTitle"
                  value={settings.siteTitle}
                  onChange={handleSettingChange}
                />
              </label>
              <label>
                로고 업로드:
                <input type="file" />
              </label>
            </div>
            <div className="settings-section">
              <h2>알림 설정</h2>
              <label>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleSettingChange}
                />
                이메일 알림
              </label>
              <label>
                <input
                  type="checkbox"
                  name="pushNotifications"
                  checked={settings.pushNotifications}
                  onChange={handleSettingChange}
                />
                푸시 알림
              </label>
            </div>
            <div className="settings-section">
              <h2>사용자 관리</h2>
              <table>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>권한</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        <button>수정</button>
                        <button>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
