import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SidebarUIContext = createContext(null);
export const useSidebarUI = () => useContext(SidebarUIContext);

export function SidebarUIProvider({ children }) {
  const [isCompact, setIsCompact] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 초기 화면 크기 설정
    setScreenWidth(window.screen.width);
    
    // 현재 브라우저 창 크기의 50% 기준으로 계산
    const computeCompact = () => {
      const currentWidth = window.innerWidth;
      const halfScreenWidth = Math.max(320, Math.round(window.screen.width * 0.5));
      const shouldBeCompact = currentWidth <= halfScreenWidth;
      
      console.log('Responsive check:', {
        currentWidth,
        halfScreenWidth,
        shouldBeCompact,
        ratio: (currentWidth / window.screen.width * 100).toFixed(1) + '%'
      });
      
      setIsCompact(shouldBeCompact);
    };

    // 초기 계산
    computeCompact();

    // 리사이즈 이벤트 리스너
    const onResize = () => computeCompact();
    const onOrient = () => computeCompact();
    
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onOrient);
    
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrient);
    };
  }, []);

  useEffect(() => { 
    // 컴팩트 모드가 아닐 때는 항상 닫기
    // 컴팩트 모드로 전환될 때도 기본적으로 닫기
    console.log('isCompact changed:', isCompact, 'current isOpen:', isOpen);
    setIsOpen(false);
  }, [isCompact]);

  const value = useMemo(() => {
    // 컴팩트 모드에서: 기본적으로 숨김, 열렸을 때만 표시
    const providerClass = `${isCompact ? 'sidebar-compact' : ''} ${isCompact && !isOpen ? 'sidebar-hidden' : ''}`.trim();
    
    console.log('SidebarUIContext value:', {
      isCompact,
      isOpen,
      providerClass,
      classes: {
        compact: isCompact ? 'sidebar-compact' : '',
        hidden: isCompact && !isOpen ? 'sidebar-hidden' : ''
      }
    });
    
    return {
      isCompact,
      isOpen,
      open: () => {
        console.log('SidebarUI: opening sidebar');
        setIsOpen(true);
      },
      close: () => {
        console.log('SidebarUI: closing sidebar');
        setIsOpen(false);
      },
      toggle: () => {
        console.log('SidebarUI: toggling sidebar, current isOpen:', isOpen);
        setIsOpen((v) => !v);
      },
      providerClass,
    };
  }, [isCompact, isOpen]);

  return <SidebarUIContext.Provider value={value}>{children}</SidebarUIContext.Provider>;
}