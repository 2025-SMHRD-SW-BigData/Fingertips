import React, { useState, useEffect } from 'react';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Sample data for notifications
    const sampleNotifications = [
      { id: 1, message: '새로운 위반 차량이 등록되었습니다: 12가3456', date: '2025-08-28T10:05:00' },
      { id: 2, message: 'CCTV 1번 카메라에 움직임이 감지되었습니다.', date: '2025-08-28T11:32:00' },
      { id: 3, message: '시스템 점검이 30분 후에 시작됩니다.', date: '2025-08-28T14:00:00' },
      { id: 4, message: '새로운 관리자가 등록되었습니다.', date: '2025-08-27T18:00:00' },
    ];
    setNotifications(sampleNotifications);
  }, []);

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <h1>알림 내역</h1>
          <div className="notification-list">
            <table>
              <thead>
                <tr>
                  <th>알림 메시지</th>
                  <th>시간</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td>{notification.message}</td>
                    <td>{new Date(notification.date).toLocaleString()}</td>
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

export default NotificationPage;