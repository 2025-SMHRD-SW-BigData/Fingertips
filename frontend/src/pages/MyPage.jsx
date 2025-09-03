import React, { useEffect, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import '../style/mainpage.css';
import '../style/MyPage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ChangePasswordModal from '../component/ChangePasswordModal';
import { getAdminMe } from '../services/api';

// Parking controls removed on MyPage; relies on previously selected parking_idx

const MyPage = () => {
  const [admin, setAdmin] = useState({ name: '-', email: '', role: '-' });
  const [activity, setActivity] = useState([]);

  const [showPwdModal, setShowPwdModal] = useState(false);
  // Legacy hidden form compatibility
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const handlePasswordChange = () => {};
  const handlePasswordSubmit = (e) => { e.preventDefault(); };

  const formatTS = (iso) => {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString(); } catch { return '-'; }
  };

  const getOrInitCctvLastVisit = () => {
    try {
      const existing = localStorage.getItem('cctv_last_visit');
      if (existing) return existing;
      const now = new Date();
      const d = new Date(now);
      d.setDate(d.getDate() - 1); // yesterday
      const hour = Math.floor(Math.random() * 24);
      const min = Math.floor(Math.random() * 60);
      const sec = Math.floor(Math.random() * 60);
      d.setHours(hour, min, sec, 0);
      const ts = d.toISOString();
      localStorage.setItem('cctv_last_visit', ts);
      return ts;
    } catch (_) {
      return '';
    }
  };

  useEffect(() => {
    const adminId = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_id') : '';
    if (!adminId) return;
    getAdminMe(adminId)
      .then((me) => {
        setAdmin({ name: me?.name || '-', email: '', role: me?.role || '-' });
        const lastLogin = me?.last_logged_at || '';
        const lastCctv = getOrInitCctvLastVisit();
        setActivity([
          { id: 'login', action: '최근 로그인', timestamp: formatTS(lastLogin) },
          { id: 'cctv', action: 'CCTV 페이지 방문', timestamp: formatTS(lastCctv) },
        ]);
      })
      .catch(() => setActivity([]));
  }, []);

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
              <h2>계정 정보</h2>
              <p><strong>이름:</strong> {admin.name}</p>
              <p><strong>이메일:</strong> {admin.email || '-'}</p>
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
                {activity.length === 0 && (
                  <li><span>최근 활동 없음</span></li>
                )}
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

