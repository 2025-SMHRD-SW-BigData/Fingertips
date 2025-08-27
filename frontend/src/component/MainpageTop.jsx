import React from 'react';
import '../style/mainpage.css';
import search from '../assets/search.png';
import bell from '../assets/bell.png';

const MainpageTop = () => {
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
          2025-08-26
        </div>
        <div className='manager'>
          관리자: 핑거팁스
        </div>
        <div className='Noti'>
          <img src={bell} alt="알림" style={{ width: "20px" }} />
        </div>
        <div className='login_out'>
          로그아웃
        </div>
      </div>
    </div>
  );
};

export default MainpageTop;