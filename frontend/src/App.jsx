import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import LiveStreamPage from './pages/LiveStreamPage'; // 새로 추가


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    
    <Routes>
      {/* 시작 페이지를 로그인으로 */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/cctv" element={<CCTVpage />} />

      {/* 실시간 영상 페이지 라우트 추가 */}
      <Route
        path="/live"
        element={
          <ProtectedRoute>
            <LiveStreamPage />
          </ProtectedRoute>
        }
      />

      {/* 로그인 성공 후 접근할 메인 페이지 (보호 라우트) */}
      <Route
        path="/mainpage"
        element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        }
      />
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
  );
}

