import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ParkingControls from '../component/ParkingControls';
import { getViolations, updateViolation, markAlertsReadByViolation, broadcastViolation } from '../services/api';

const formatTime = (iso) => {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString(); } catch { return '-'; }
};

const ViolationPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState({});
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalChoice, setModalChoice] = useState('');
  const [modalMemo, setModalMemo] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await getViolations({ page: 1, limit: 20, search: searchQuery });
      setRows(Array.isArray(items) ? items : []);
    } catch (e) {
      setError(e?.message || 'Failed to load violations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // parse search from URL
    try {
      const sp = new URLSearchParams(location.search);
      const s = (sp.get('search') || '').trim();
      setSearchQuery(s);
    } catch (_) {}
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => window.removeEventListener('parking-change', handler);
  }, [location.search]);

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
        // Temporary: treat same as 처리완료, but status text '계도방송 완료'
        await updateViolation(id, { admin_status: '계도방송 완료', admin_confirmed_at: nowIso, admin_confirmed_by: adminId || undefined, admin_content: modalMemo || '' });
        if (adminId) {
          await markAlertsReadByViolation(id, { adminId });
          try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
        }
        setRows((prev) => prev.map((r) => (r.violation_idx === id ? { ...r, admin_status: '계도방송 완료' } : r)));
      }
      setModalOpen(false);
    } catch (e) {
      setModalError(e?.message || '처리에 실패했습니다.');
    } finally {
      setModalBusy(false);
      setMarking((m) => { const n = { ...m }; delete n[id]; return n; });
    }
  };

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header">
            <h1>위반차량 정보</h1>
            <div className="notif-tools">
              <ParkingControls />
            </div>
          </div>
          <div className="violation-list">
            {loading && <p>불러오는 중…</p>}
            {!loading && error && <p style={{ color: 'tomato' }}>{error}</p>}
            {!loading && !error && (
              <table>
                <thead>
                  <tr>
                    <th>차량번호</th>
                    <th>구역</th>
                    <th>위반유형</th>
                    <th>위반일시</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isDone = !!r.admin_status;
                    const busy = !!marking[r.violation_idx];
                    return (
                      <tr key={r.violation_idx}>
                        <td>{r.ve_number}</td>
                        <td>{r.parking_loc || r.space_id || '-'}</td>
                        <td>{r.violation_type || '-'}</td>
                        <td>{formatTime(r.violation_date)}</td>
                        <td>{isDone ? r.admin_status : '미처리'}</td>
                        <td>
                          {isDone ? (
                            <span style={{ color: '#9aa0a6' }}>-</span>
                          ) : (
                            <button className="action-btn" disabled={busy} onClick={() => openModal(r.violation_idx)}>
                              {busy ? '처리 중…' : '확인'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#ccc' }}>표시할 데이터가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
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
      </div>
    </div>
  );
};

// Inline modal for status selection
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
          {/* 각 옵션을 div로 한 번 더 감싸서 그룹화 */}
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

export default ViolationPage;
