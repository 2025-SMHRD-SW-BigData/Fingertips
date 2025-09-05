import React, { useEffect, useState, useMemo } from 'react';
import "../style/mainpage.css";
import "../style/dashboard.css";
import { getRecentViolations, getViolations, updateViolation, markAlertsReadByViolation } from '../services/api';
import { Link } from 'react-router-dom';

const formatTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value || '';
    const mm = String(get('month')).padStart(2, '0');
    const dd = String(get('day')).padStart(2, '0');
    const ap = get('dayPeriod');
    const hh = get('hour');
    const mi = get('minute');
    return `${mm}월 ${dd}일 ${ap} ${hh}:${mi}`;
  } catch {
    return '-';
  }
};

const Mainpage_vio = ({ asCard = false, showStatus = false, showAction = false, className = '' }) => {
  const [rows, setRows] = useState([]);
  const [statusById, setStatusById] = useState(() => new Map());
  const wrapperClass = asCard ? `card vio-card ${className}`.trim() : `vio box-style ${className}`.trim();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalChoice, setModalChoice] = useState('');
  const [modalMemo, setModalMemo] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');
  const [marking, setMarking] = useState({});

  const statusClass = useMemo(() => (val) => {
    const raw = String(val || '').toLowerCase();
    if (!raw) return 'chip';
    // Map common admin_status and variants to chip colors
    if (raw.includes('중') || raw.includes('계도') || raw.includes('progress')) return 'chip orange'; // 처리중/계도방송
    if (raw.includes('대기') || raw.includes('보류') || raw.includes('pending') || raw.includes('검토')) return 'chip purple';
    if (raw.includes('완료') || raw.includes('확정') || raw.includes('confirmed') || raw.includes('경고') || raw.includes('위반')) return 'chip red';
    return 'chip';
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getRecentViolations();
        const list = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setRows(list);

        // If we need status/action, enrich with admin_status via getViolations
        if ((showStatus || showAction) && list.length > 0) {
          try {
            const limit = Math.min(50, list.length + 10);
            const { items } = await getViolations({ page: 1, limit });
            const m = new Map();
            (Array.isArray(items) ? items : []).forEach((it) => {
              if (it && it.violation_idx != null) {
                m.set(it.violation_idx, it.admin_status || it.status || it.violation_status || it.state || '');
              }
            });
            if (mounted) setStatusById(m);
          } catch (e) {
            if (mounted) setStatusById(new Map());
          }
        } else if (mounted) {
          setStatusById(new Map());
        }
      } catch (err) {
        console.error('Failed to load recent violations', err);
        if (mounted) {
          setRows([]);
          setStatusById(new Map());
        }
      }
    };
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => {
      mounted = false;
      window.removeEventListener('parking-change', handler);
    };
  }, [showStatus, showAction]);

  const openModal = (id) => {
    setModalId(id);
    setModalChoice('');
    setModalMemo('');
    setModalError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (modalBusy) return;
    setModalOpen(false);
    setModalId(null);
    setModalChoice('');
    setModalMemo('');
    setModalError('');
  };

  const handleModalConfirm = async () => {
    const id = modalId;
    if (!id || !modalChoice) return;
    setModalBusy(true);
    setMarking((m) => ({ ...m, [id]: true }));
    setModalError('');
    const adminId = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_id') : '';
    try {
      const nowIso = new Date().toISOString();
      if (modalChoice === '처리완료') {
        await updateViolation(id, { admin_status: '처리완료', admin_confirmed_at: nowIso, admin_confirmed_by: adminId || undefined });
        if (adminId) {
          await markAlertsReadByViolation(id, { adminId });
          try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
        }
        setRows((prev) => prev.map((r) => (r.violation_idx === id ? { ...r, admin_status: '처리완료' } : r)));
      } else if (modalChoice === '보류') {
        await updateViolation(id, { admin_status: '보류', admin_content: modalMemo || '' });
        setRows((prev) => prev.map((r) => (r.violation_idx === id ? { ...r, admin_status: '보류' } : r)));
        try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
      } else if (modalChoice === '계도방송') {
        await updateViolation(id, { admin_status: '계도방송 완료', admin_confirmed_at: nowIso, admin_confirmed_by: adminId || undefined, admin_content: modalMemo || '' });
        if (adminId) {
          await markAlertsReadByViolation(id, { adminId });
          try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
        }
        setRows((prev) => prev.map((r) => (r.violation_idx === id ? { ...r, admin_status: '계도방송 완료' } : r)));
      }
      setModalOpen(false);
      // Refresh statusById after update
      try {
        const { items } = await getViolations({ page: 1, limit: 50 });
        const m = new Map();
        (Array.isArray(items) ? items : []).forEach((it) => {
          if (it && it.violation_idx != null) {
            m.set(it.violation_idx, it.admin_status || it.status || it.violation_status || it.state || '');
          }
        });
        setStatusById(m);
      } catch (_) {}
    } catch (e) {
      setModalError(e?.message || '처리에 실패했습니다.');
    } finally {
      setModalBusy(false);
      setMarking((m) => { const n = { ...m }; delete n[id]; return n; });
    }
  };

  return (
    <>
    <div className={wrapperClass} style={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', width: '100%' }}>
      <div className="header">
        <h3>최근 위반</h3>
        <Link to="/violations" className="all-btn" style={{ textDecoration: 'none' }}>전체 보기</Link>
      </div>
      <table className="data-table">
        <colgroup>
          {/* 차량번호, 유형, 시각, (상태), (작업) */}
          <col style={{ width: showStatus || showAction ? '34%' : '44%' }} />
          <col style={{ width: showStatus || showAction ? '28%' : '36%' }} />
          <col style={{ width: showStatus || showAction ? '16%' : '20%' }} />
          {showStatus && <col style={{ width: '12%' }} />}
          {showAction && <col style={{ width: '10%' }} />}
        </colgroup>
        <thead>
          <tr>
            <th>차량번호</th>
            <th>유형</th>
            <th>시각</th>
            {showStatus && <th>상태</th>}
            {showAction && <th>작업</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const resolvedStatus = statusById.get(row.violation_idx) || row.admin_status || row.status || row.violation_status || row.state || '';
            const isDone = /완료|확정|confirmed|종결|완룼됨/.test(String(resolvedStatus).toLowerCase());
            const isCompleted = isDone;
            return (
              <tr key={row.violation_idx}>
                <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{row.ve_number}</td>
                <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{row.violation_type}</td>
                <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{formatTime(row.violation_date)}</td>
                {showStatus && (
                  <td>
                    <span className={statusClass(resolvedStatus)}>
                      {resolvedStatus || '미처리'}
                    </span>
                  </td>
                )}
                {showAction && (
                  <td>
                    {isCompleted ? (
                      <span style={{ color: '#9aa0a6' }}>-</span>
                    ) : (
                      <button className="action-btn" disabled={marking[row.violation_idx]} onClick={() => openModal(row.violation_idx)}>
                        {marking[row.violation_idx] ? '처리 중…' : '검토'}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3 + (showStatus ? 1 : 0) + (showAction ? 1 : 0)} style={{ textAlign: 'center', color: '#ccc' }}>표시할 데이터가 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <Modal
      open={modalOpen}
      onClose={closeModal}
      onConfirm={handleModalConfirm}
      choice={modalChoice}
      setChoice={setModalChoice}
      memo={modalMemo}
      setMemo={setModalMemo}
      busy={modalBusy}
      error={modalError}
    />
    </>
  );
};

// Modal component (same as ViolationPage)
const Modal = ({ open, onClose, onConfirm, choice, setChoice, memo, setMemo, busy, error }) => {
  if (!open) return null;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>처리 상태 선택</h3>
        </div>
        <div className="modal-body">
         <div className="modal-options">
            <div className="radio-option">
              <input type="radio" id="viost-1" name="viost" value="계도방송" checked={choice === '계도방송'} onChange={(e) => setChoice(e.target.value)} />
              <label htmlFor="viost-1">계도방송</label>
            </div>
            <div className="radio-option">
              <input type="radio" id="viost-2" name="viost" value="보류" checked={choice === '보류'} onChange={(e) => setChoice(e.target.value)} />
              <label htmlFor="viost-2">보류</label>
            </div>
            <div className="radio-option">
              <input type="radio" id="viost-3" name="viost" value="처리완료" checked={choice === '처리완료'} onChange={(e) => setChoice(e.target.value)} />
              <label htmlFor="viost-3">처리완료</label>
            </div>
        </div>
          <textarea className="modal-textarea" placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
          {error && <div style={{ color: 'tomato', marginTop: 8 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} disabled={busy} className="all-btn">취소</button>
          <button onClick={onConfirm} disabled={busy || !choice} className="action-btn">{busy ? '처리 중…' : '확인'}</button>
        </div>
      </div>
    </div>
  );
};

export default Mainpage_vio;
