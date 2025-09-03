import React, { useMemo, useState } from 'react';
import { register as registerApi } from '../services/api';
import '../style/AdminSignupPage.css';
import { FiUser, FiLock, FiPhone, FiMail } from 'react-icons/fi';

const phoneFormat = (v) => {
  const digits = (v || '').replace(/\D/g, '');
  if (!digits.startsWith('010')) return '010-';
  const a = '010';
  const mid = digits.slice(3, 7);
  const tail = digits.slice(7, 11);
  if (mid.length === 0) return '010-';
  if (mid.length < 4) return `010-${mid}`;
  if (tail.length === 0) return `010-${mid}-`;
  return `010-${mid}-${tail}`.slice(0, 13);
};

export default function AdminSignup() {
  const [form, setForm] = useState({
    admin_id: '',
    password: '',
    password_confirm: '',
    name: '',
    phone: '010-',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.admin_id?.length >= 4 &&
      form.password?.length >= 8 &&
      form.password === form.password_confirm &&
      /^010-\d{4}-\d{4}$/.test(form.phone) &&
      /[^@\s]+@[^@\s]+\.[^@\s]+/.test(form.email)
    );
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setForm((f) => ({ ...f, phone: phoneFormat(value) }));
      return;
    }
    if (name === 'email') {
      setForm((f) => ({ ...f, email: value.toLowerCase() }));
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!form.admin_id || form.admin_id.length < 4) next.admin_id = '아이디는 4자 이상이어야 합니다';
    if (!form.password || form.password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다';
    if (form.password !== form.password_confirm) next.password_confirm = '비밀번호가 일치하지 않습니다';
    if (!/^010-\d{4}-\d{4}$/.test(form.phone)) next.phone = '전화번호는 010-####-#### 형식이어야 합니다';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) next.email = '유효한 이메일 주소가 아닙니다';
    if (!form.name) next.name = '이름은 필수입니다';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        admin_id: form.admin_id.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim().toLowerCase(),
      };
      await registerApi(payload);
      alert('회원가입에 성공했습니다. 로그인 페이지로 이동합니다.');
      window.location.assign('/login');
    } catch (err) {
      const msg = err?.message || '서버 오류가 발생했습니다.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1>관리자 회원가입</h1>
        <form onSubmit={onSubmit} noValidate className="signup-form">
          <div className="input-group">
            <FiUser className="input-icon" />
            <input name="admin_id" value={form.admin_id} onChange={onChange} placeholder="아이디" required />
            {errors.admin_id && <span className="error-message">{errors.admin_id}</span>}
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" name="password" value={form.password} onChange={onChange} placeholder="비밀번호 (8자 이상)" required />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" name="password_confirm" value={form.password_confirm} onChange={onChange} placeholder="비밀번호 확인" required />
            {errors.password_confirm && <span className="error-message">{errors.password_confirm}</span>}
          </div>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input name="name" value={form.name} onChange={onChange} placeholder="이름" required />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="input-group">
            <FiPhone className="input-icon" />
            <input inputMode="numeric" name="phone" value={form.phone} onChange={onChange} placeholder="010-1234-5678" required />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" name="email" value={form.email} onChange={onChange} placeholder="user@example.com" required />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          <button className="signup-btn" type="submit" disabled={!canSubmit || submitting}>
            {submitting ? '처리 중…' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}