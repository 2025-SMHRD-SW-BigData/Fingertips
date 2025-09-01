import React, { useEffect, useState } from 'react';
import '../style/mainpage.css';
import Xcarbell from '../assets/Xcarbell.png';
import checklist from '../assets/checklist.png';
import vidio from '../assets/vidio.png';
import graf from '../assets/graf.png';
import mypage from '../assets/mypage.png';
import setting from '../assets/setting.png';
import { getUnreadAlerts, getViolationsTotal } from '../services/api';

import { Link, useLocation } from 'react-router-dom';
import ParkingControls from './ParkingControls';

const SidebarItem = ({ icon, text, count }) => (
  <div className="side_sbox">
    <img src={icon} alt={text} style={{ width: "20px", filter: 'brightness(0) invert(1)' }} />
    <span style={{ flexGrow: 1, marginLeft: "10px" }}>{text}</span>
    {typeof count === 'number' && count > 0 && <span className="notification-badge">{count}</span>}
  </div>
);

const Sidebar = () => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);

  useEffect(() => {
    const adminId = localStorage.getItem('admin_id');
    if (!adminId) {
      setUnreadCount(0);
      setViolationsCount(0);
      return;
    }
    let mounted = true;
    getUnreadAlerts(adminId)
      .then((rows) => {
        if (mounted) setUnreadCount(Array.isArray(rows) ? rows.length : 0);
      })
      .catch((err) => console.error('Failed to load unread alerts', err));

    getViolationsTotal()
      .then((total) => {
        if (mounted) setViolationsCount(Number(total) || 0);
      })
      .catch((err) => console.error('Failed to load violations total', err));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className='Sidebar_box box-style'>

          <Link to="/violations" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={Xcarbell} text="위반차량" count={7} />
    </Link>
      <Link to="/notifications" style={{ textDecoration: 'none', color: 'inherit' }}><SidebarItem icon={checklist} text="알림 내역" count={7} /></Link>

      <Link to="/cctv" style={{ textDecoration: 'none', color: 'inherit' }}><SidebarItem icon={vidio} text="영상 정보" /></Link>
      <Link to="/statistics" style={{ textDecoration: 'none', color: 'inherit' }}><SidebarItem icon={graf} text="통계 분석" /></Link>
      <Link to="/mypage" style={{ textDecoration: 'none', color: 'inherit' }}><SidebarItem icon={mypage} text="마이 페이지" /></Link>
      <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}><SidebarItem icon={setting} text="설정" /></Link>
    </div>
  );
};

export default Sidebar;

