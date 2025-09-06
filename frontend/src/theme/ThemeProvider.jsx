import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeCtx = createContext({ theme: 'dark', setTheme: () => {} });
export const useTheme = () => useContext(ThemeCtx);

const getSystem = () => {
  try {
    return (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
  } catch (_) {
    return 'dark';
  }
};
const getStored = () => {
  try { return localStorage.getItem('theme') || ''; } catch { return ''; }
};

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = getStored();
    // 만약 라이트모드로 설정되어 있다면 다크모드로 강제 변경
    if (stored === 'light') {
      try { localStorage.setItem('theme', 'dark'); } catch (_) {}
      return 'dark';
    }
    return stored || 'dark'; // 기본값은 다크모드
  });

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch (_) {}
    const el = document.documentElement;
    el.classList.remove('theme-dark', 'theme-light');
    el.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    el.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

