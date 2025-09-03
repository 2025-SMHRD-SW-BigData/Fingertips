import React, { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import '../style/mainpage.css';
import '../style/MyPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ChangePasswordModal from '../component/ChangePasswordModal';
// Parking controls removed on MyPage; relies on previously selected parking_idx

const MyPage = () => {
  const [admin, setAdmin] = useState({
    name: '관리자',
    email: 'admin@example.com',
    role: 'Super Admin',
  });

  const [activity, setActivity] = useState([
    { id: 1, action: 'Logged in', timestamp: '2025-08-28 10:00:00' },
    { id: 2, action: 'Viewed CCTV page', timestamp: '2025-08-28 10:05:00' },
    { id: 3, action: 'Updated notification settings', timestamp: '2025-08-28 10:15:00' },
  ]);

  const [showPwdModal, setShowPwdModal] = useState(false);
  // Legacy hidden form compatibility
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const handlePasswordChange = () => {};
  const handlePasswordSubmit = (e) => { e.preventDefault(); };

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <h1>마이페이지</h1>
          <div className="mypage-content">
            <div className="profile-section">
              <h2>프로필 정보</h2>
              <p><strong>이름:</strong> {admin.name}</p>
              <p><strong>이메일:</strong> {admin.email}</p>
              <p><strong>권한:</strong> {admin.role}</p>
              <button type="button" onClick={() => setShowPwdModal(true)} className="btn-outline" style={{ marginTop: '10px' }}>
                <FiLock />
                <span style={{ marginLeft: '8px' }}>비밀번호 변경</span>
              </button>
            </div>
            <div className="password-section">
              <h2>비밀번호 변경</h2>
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  name="current"
                  placeholder="현재 비밀번호"
                  value={password.current}
                  onChange={handlePasswordChange}
                />
                <input
                  type="password"
                  name="new"
                  placeholder="새 비밀번호"
                  value={password.new}
                  onChange={handlePasswordChange}
                />
                <input
                  type="password"
                  name="confirm"
                  placeholder="새 비밀번호 확인"
                  value={password.confirm}
                  onChange={handlePasswordChange}
                />
                <button type="submit">비밀번호 변경</button>
              </form>
            </div>
            <div className="change-password-cta">
              <button type="button" onClick={() => setShowPwdModal(true)}>비밀번호 변경</button>
            </div>
            <div className="activity-section">
              <h2>최근 활동</h2>
              <ul>
                {activity.map((item) => (
                  <li key={item.id}>
                    <span>{item.action}</span>
                    <span>{item.timestamp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ChangePasswordModal isOpen={showPwdModal} onClose={() => setShowPwdModal(false)} />
        </div>
      </div>
    </div>
  );
};

export default MyPage;


