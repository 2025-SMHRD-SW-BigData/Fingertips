import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import '../style/LoginPage.css';
import { FiUser, FiLock } from 'react-icons/fi';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ admin_id: '', password: '' });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.admin_id || !form.password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await loginApi(form);
      const token = result?.token || result?.access_token || result?.accessToken || result?.jwt || result?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        // Backend does not return a token; mark session locally so ProtectedRoute passes
        localStorage.setItem('token', 'session');
      }
      if (result?.adminName) localStorage.setItem('adminName', result.adminName);
      if (result?.admin_id) localStorage.setItem('admin_id', result.admin_id);
      if (result?.role) localStorage.setItem('role', result.role);
      navigate('/mainpage', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || '로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>로그인</h1>
        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              name="admin_id"
              value={form.admin_id}
              onChange={onChange}
              placeholder="아이디"
              autoComplete="username"
              required
            />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button className="login-btn" type="submit" disabled={pending}>
            {pending ? '로그인 중…' : '로그인'}
          </button>
        </form>
        <div className="signup-link">
          <Link to="/admin/signup">관리자 회원가입</Link>
        </div>
      </div>
    </div>
  );
}