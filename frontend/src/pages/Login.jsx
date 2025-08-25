import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// 로그인 API 호출 함수
async function loginApi({ username, password }) {
  const res = await fetch('/api/login', { // 실제 API 엔드포인트에 맞게 수정하세요.
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let detail = `HTTP Error: ${res.status}`;
    try {
      const data = await res.json();
      // 서버에서 오는 에러 메시지를 사용 (e.g., data.message)
      detail = data?.message || data?.error || detail;
    } catch (e) {
      // JSON 파싱 실패 시
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}


export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await loginApi(form);
      // 서버 응답에서 토큰을 추출합니다. 응답 형태에 맞게 키를 조정해야 할 수 있습니다.
      const token = result?.token || result?.access_token || result?.accessToken || result?.jwt || result?.data?.token;
      
      if (token) {
        localStorage.setItem('token', token);
      } else {
        // 토큰이 없는 성공 응답(세션 기반 인증 등)의 경우, 로그인 상태 마커를 저장합니다.
        localStorage.setItem('token', 'session');
      }
      // 로그인 성공 후 메인 페이지로 이동합니다.
      navigate('/mainpage', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || '로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="card">
      <h1>로그인</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label>아이디</label>
          <input
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="아이디"
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label>비밀번호</label>
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
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        <button className="primary" type="submit" disabled={pending}>
          {pending ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link to="/admin/signup">관리자 회원가입</Link>
      </div>
    </div>
  );
}