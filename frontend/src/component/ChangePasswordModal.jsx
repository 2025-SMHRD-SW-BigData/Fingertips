import React, { useEffect, useState } from 'react';
import { changePassword } from '../services/api';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setForm({ current: '', next: '', confirm: '' });
      setError('');
      setSuccess('');
      setBusy(false);
      setShowPassword({ current: false, next: false, confirm: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleShowPassword = (name) => {
    setShowPassword((s) => ({ ...s, [name]: !s[name] }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.current || !form.next || !form.confirm) {
      setError('모든 항목을 입력해주세요.');
      return;
    }
    if (form.next !== form.confirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.next.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    const admin_id = localStorage.getItem('admin_id');
    if (!admin_id) {
      setError('관리자 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      return;
    }
    setBusy(true);
    try {
      await changePassword({ admin_id, current_password: form.current, new_password: form.next });
      setSuccess('비밀번호가 변경되었습니다.');
      setTimeout(() => {
        onClose && onClose();
      }, 800);
    } catch (e) {
      setError(e?.message || '변경에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Change password">
      <div className="modal-panel">
        <div className="modal-header">
          <h3>비밀번호 변경</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={onSubmit} className="modal-body">
          {error && <div className="modal-error">{error}</div>}
          {success && <div className="modal-success">{success}</div>}
          
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              type={showPassword.current ? 'text' : 'password'}
              name="current"
              placeholder="현재 비밀번호"
              value={form.current}
              onChange={onChange}
              autoFocus
              disabled={busy}
            />
            <button type="button" onClick={() => toggleShowPassword('current')} className="password-toggle">
              {showPassword.current ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword.next ? 'text' : 'password'}
              name="next"
              placeholder="새 비밀번호"
              value={form.next}
              onChange={onChange}
              disabled={busy}
            />
            <button type="button" onClick={() => toggleShowPassword('next')} className="password-toggle">
              {showPassword.next ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              name="confirm"
              placeholder="새 비밀번호 확인"
              value={form.confirm}
              onChange={onChange}
              disabled={busy}
            />
            <button type="button" onClick={() => toggleShowPassword('confirm')} className="password-toggle">
              {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={busy}>취소</button>
            <button type="submit" className="submit-btn" disabled={busy}>{busy ? '변경 중...' : '변경'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;