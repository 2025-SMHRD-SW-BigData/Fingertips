import React from 'react';
import '../style/mainpage.css';
import Xcarbell from '../assets/Xcarbell.png';
import checklist from '../assets/checklist.png';
import vidio from '../assets/vidio.png';
import graf from '../assets/graf.png';
import mypage from '../assets/mypage.png';
import setting from '../assets/setting.png';

const SidebarItem = ({ icon, text, count }) => (
  <div className="side_sbox">
    <img src={icon} alt={text} style={{ width: "20px", filter: 'brightness(0) invert(1)' }} />
    <span style={{ flexGrow: 1, marginLeft: "10px" }}>{text}</span>
    {count && <span className="notification-badge">{count}</span>}
  </div>
);

const Sidebar = () => {
  return (
    <div className='Sidebar_box box-style'>
      <SidebarItem icon={Xcarbell} text="위반차량" count={7} />
      <SidebarItem icon={checklist} text="알림 내역" count={7} />
      <SidebarItem icon={vidio} text="영상 정보" />
      <SidebarItem icon={graf} text="통계 분석" />
      <SidebarItem icon={mypage} text="마이 페이지" />
      <SidebarItem icon={setting} text="설정" />
    </div>
  );
};

export default Sidebar;
