import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainPage from './component/Mainpage';
import AdminSignup from './pages/AdminSignup';
import CCTVpage from './component/CCTVpage';
import ViolationPage from './pages/ViolationPage';

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
      
    </Routes>
  );
}

