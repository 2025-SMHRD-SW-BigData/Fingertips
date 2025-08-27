import React from 'react';
import '../style/mainpage.css';
import logo from '../assets/logo.png';

const Logo = () => {
  return (
    <div className='Mainpage_logo box-style'>
      <div className="logo-container">
        <img 
          src={logo} 
          alt="로고" 
          style={{
            width: '50px',
            height: "50px",
            filter: 'brightness(0) invert(1)'
          }} 
        />
        <span style={{
          fontSize: "30px",
          fontWeight: "bold",
          fontFamily: "'Pretendard Variable', sans-serif"
        }}>
          이음주차
        </span>
      </div>
    </div>
  );
};

export default Logo;
