import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { argon2id } from 'hash-wasm';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setError('');
    try {
      const result = await loginApi({ username, password });
      const token = result?.token || result?.access_token || result?.accessToken || result?.jwt || result?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      } else {
        // 서버가 토큰 대신 쿠키 세션만 설정한 경우 등, 성공 응답이면 가드 통과용 마커 저장
        localStorage.setItem('token', 'session');
      }
      navigate('/mainpage', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const message = err?.message || '로그인 실패. 다시 시도하세요.';
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
          />
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={pending}>
          {pending ? 'Logging in…' : 'Login'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

function joinUrl(base, path) {
  const b = base?.endsWith('/') ? base.slice(0, -1) : base || '';
  const p = path?.startsWith('/') ? path : `/${path || ''}`;
  return `${b}${p}`;
}

async function tryFetch(url, body, useCredentials) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: useCredentials ? 'include' : 'same-origin',
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      detail = data?.message || data?.error || detail;
    } catch (_) {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function loginApi({ username, password }) {
  // Argon2 pre-hash on the client to satisfy backend requirements
  const iterations = Number(import.meta.env.VITE_ARGON2_ITER || 3);
  const memoryKB = Number(import.meta.env.VITE_ARGON2_MEM_KB || 1024);
  const hashLength = Number(import.meta.env.VITE_ARGON2_HASH_LEN || 32);
  const saltSource = import.meta.env.VITE_PWD_SALT_SOURCE || 'username'; // 'username' | 'static'
  const staticSalt = import.meta.env.VITE_PWD_SALT_STATIC || '';
  const salt = (saltSource === 'static' ? staticSalt : username) || '';
  const pwdPreHash = await argon2id({
    password,
    salt,
    parallelism: 1,
    iterations,
    memorySize: memoryKB,
    hashLength,
    outputType: 'hex', // change to 'base64' if backend expects base64
  });

  const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
  const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH ?? '/login';
  const USE_CRED = (import.meta.env.VITE_USE_CREDENTIALS ?? '0') === '1';

  const url = joinUrl(API_BASE, LOGIN_PATH); // e.g., /api/login
  return tryFetch(url, { username, pwdPreHash }, USE_CRED);
}
