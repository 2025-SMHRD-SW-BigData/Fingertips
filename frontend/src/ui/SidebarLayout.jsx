import React from 'react';
import { useSidebarUI } from './SidebarUIContext';

export default function SidebarLayout({ children, className = "" }) {
  const ui = useSidebarUI();
  const finalClassName = `${className} ${ui?.providerClass || ''}`.trim();
  
  console.log('SidebarLayout render:', {
    className,
    providerClass: ui?.providerClass,
    finalClassName,
    isCompact: ui?.isCompact,
    isOpen: ui?.isOpen
  });
  
  return (
    <div className={finalClassName}>
      {ui?.isCompact && ui?.isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => {
            console.log('Overlay clicked - closing sidebar');
            ui.close();
          }} 
          aria-hidden="true" 
        />
      )}
      {children}
    </div>
  );
}