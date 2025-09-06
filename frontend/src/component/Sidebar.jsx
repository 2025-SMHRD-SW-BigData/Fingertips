import React, { useEffect, useState } from 'react';
import '../style/mainpage.css';
import Xcarbell from '../assets/Xcarbell.png';
import checklist from '../assets/checklist.png';
import vidio from '../assets/vidio.png';
import graf from '../assets/graf.png';
import mypage from '../assets/mypage.png';
import setting from '../assets/setting.png';
import { getUnreadAlerts, getViolationsTotal } from '../services/api';
import { useSidebarUI } from '../ui/SidebarUIContext';

import { Link, useLocation } from 'react-router-dom';

const SidebarItem = ({ icon, text, count }) => (
  <div className="side_sbox">
    <img src={icon} alt={text} style={{ width: '20px', filter: 'brightness(0) invert(1)' }} />
    <span style={{ flexGrow: 1, marginLeft: '10px' }}>{text}</span>
    {typeof count === 'number' && count > 0 && <span className="notification-badge">{count}</span>}
  </div>
);

const Sidebar = () => {
  useLocation();
  const ui = useSidebarUI();
  const [unreadCount, setUnreadCount] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);

  // 컴팩트 모드에서 숨김 상태일 때 인라인 스타일로 강제 숨김
  const forceHideStyle = ui?.isCompact && !ui?.isOpen ? { 
    display: 'none',
    visibility: 'hidden',
    opacity: 0 
  } : {};

  useEffect(() => {
    const adminId = localStorage.getItem('admin_id');
    if (!adminId) {
      setUnreadCount(0);
      setViolationsCount(0);
      return;
    }
    let mounted = true;
    const load = () => {
      getUnreadAlerts(adminId)
        .then((rows) => {
          if (mounted) setUnreadCount(Array.isArray(rows) ? rows.length : 0);
        })
        .catch(() => mounted && setUnreadCount(0));

      getViolationsTotal()
        .then((total) => {
          if (mounted) setViolationsCount(Number(total) || 0);
        })
        .catch(() => mounted && setViolationsCount(0));
    };
    load();
    const onAlerts = () => load();
    const onParking = () => load();
    const onDistrict = () => load();
    window.addEventListener('alerts-updated', onAlerts);
    window.addEventListener('parking-change', onParking);
    window.addEventListener('district-change', onDistrict);
    return () => {
      mounted = false;
      window.removeEventListener('alerts-updated', onAlerts);
      window.removeEventListener('parking-change', onParking);
      window.removeEventListener('district-change', onDistrict);
    };
  }, []);

  console.log('Sidebar render:', { 
    isCompact: ui?.isCompact, 
    isOpen: ui?.isOpen, 
    shouldHide: ui?.isCompact && !ui?.isOpen,
    forceHideStyle 
  });

  return (
    <div 
      className="Sidebar_box box-style" 
      id="sidebar"
      style={forceHideStyle}
    >
      <Link to="/violations" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={Xcarbell} text="위반차량" count={violationsCount} />
      </Link>
      <Link to="/notifications" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={checklist} text="알림 목록" count={unreadCount} />
      </Link>

      <Link to="/cctv" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={vidio} text="영상 정보" />
      </Link>
      <Link to="/live" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={vidio} text="실시간 영상" />
      </Link>
      <Link to="/statistics" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={graf} text="통계 분석" />
      </Link>
      <Link to="/mypage" style={{ textDecoration: 'none', color: 'inherit' }}>
        <SidebarItem icon={mypage} text="마이 페이지" />
      </Link>
    </div>
  );
};

export default Sidebar;
