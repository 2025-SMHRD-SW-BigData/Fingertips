import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './theme/ThemeProvider';
import { SidebarUIProvider } from './ui/SidebarUIContext';
import './style/theme.css';
import Login from './pages/Login';
import MainPage from './component/Mainpage';
import AdminSignup from './pages/AdminSignup';
import CCTVpage from './component/CCTVpage';
import ViolationPage from './pages/ViolationPage';
import NotificationPage from './pages/NotificationPage';
import MyPage from './pages/MyPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import InOutPage from './pages/InOutPage';
import LiveStreamPage from './pages/LiveStreamPage';
import DashboardV2 from './pages/DashboardV2';

function ProtectedRoute({ children }) {
  const hasToken = (() => {
    try { return !!localStorage.getItem('token'); } catch (_) { return false; }
  })();
  const hasSession = (() => {
    try { return sessionStorage.getItem('session') === '1'; } catch (_) { return false; }
  })();
  return (hasToken || hasSession) ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // One-time migration: remove legacy placeholder token
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t === 'session') localStorage.removeItem('token');
    } catch (_) {}
  }, []);
  return (
    <ThemeProvider>
      <SidebarUIProvider>
        <Routes>
        {/* 기본 진입은 대시보드로 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/cctv" element={<CCTVpage />} />

        {/* 라이브 스트림 */}
        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <LiveStreamPage />
            </ProtectedRoute>
          }
        />

        {/* 레거시 메인 페이지 */}
        <Route
          path="/mainpage"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/legacy"
          element={
            <ProtectedRoute>
              <MainPage />
            </ProtectedRoute>
          }
        />

        {/* 새 대시보드 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardV2 />
            </ProtectedRoute>
          }
        />

        {/* 나머지 보호 라우트 */}
        <Route
          path="/violations"
          element={
            <ProtectedRoute>
              <ViolationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inout"
          element={
            <ProtectedRoute>
              <InOutPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </SidebarUIProvider>
    </ThemeProvider>
  );
}
