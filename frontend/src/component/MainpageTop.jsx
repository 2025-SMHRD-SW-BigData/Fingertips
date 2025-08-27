import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/mainpage.css';
import search from '../assets/search.png';
import bell from '../assets/bell.png';

const MainpageTop = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminName') || localStorage.getItem('admin_id') || '관리자';
  const today = new Date().toISOString().slice(0, 10);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('adminName');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('role');
    } catch (e) {
      // ignore storage errors
    }
    navigate('/login', { replace: true });
  };

  return (
    <div className='Top_box box-style'>
      <div className="search-container">
        <img src={search} alt="검색" className='search-icon' />
        <input
          type="text"
          placeholder="차량번호 / 구역 / 카메라 이름 검색"
          className="serch"
        />
      </div>
      <div className="top-bar-widgets">
        <div className='today'>
          {today}
        </div>
        <div className='manager'>
          관리자: {adminName}
        </div>
        <div className='Noti'>
          <img src={bell} alt="알림" style={{ width: "20px" }} />
        </div>
        <div className='login_out'>
          <button onClick={handleLogout} className='logout-btn'>로그아웃</button>
        </div>
      </div>
    </div>
  );
};

export default MainpageTop;

