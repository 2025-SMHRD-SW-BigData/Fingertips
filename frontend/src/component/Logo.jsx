import React from 'react';
import '../style/mainpage.css';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { useSidebarUI } from '../ui/SidebarUIContext';

const Logo = () => {
  const ui = useSidebarUI();
  const showBurger = ui?.isCompact;
  
  // 디버깅을 위한 로깅
  console.log('Logo render:', { isCompact: ui?.isCompact, isOpen: ui?.isOpen, showBurger });
  
  return (
    <>
      {/* 햄버거 버튼 - 컴팩트 모드에서만 화면 왼쪽 위에 고정 */}
      {showBurger && (
        <button
          type="button"
          className="hamburger-btn"
          aria-label={ui.isOpen ? '사이드바 닫기' : '사이드바 열기'}
          aria-controls="sidebar"
          aria-expanded={ui.isOpen ? 'true' : 'false'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Hamburger button clicked!', { isOpen: ui.isOpen, isCompact: ui.isCompact });
            ui.toggle();
          }}
        >
          <svg 
            width="20" 
            height="16" 
            viewBox="0 0 20 16" 
            fill="none"
            style={{ color: 'var(--text-body)' }}
          >
            <path 
              d="M0 1h20M0 8h20M0 15h20" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      
      {/* 로고 영역 */}
      <div className='Mainpage_logo box-style'>
        <div className="logo-container">
          <Link to="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
      </div>
    </>
  );
};

export default Logo;
