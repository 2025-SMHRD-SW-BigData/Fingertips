import React from 'react';
import '../style/mainpage.css';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <div className='Mainpage_logo box-style'>
      <Link to="/mainpage" style={{ textDecoration: 'none', color: 'inherit' }}>
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
      </Link>
    </div>
  );
};

export default Logo;
