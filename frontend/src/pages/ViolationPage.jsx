import React, { useState, useEffect, useMemo } from 'react';
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pageMeta, setPageMeta] = useState({ totalItems: 0, pageSize: 20, currentPage: 1, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState({ from: '', to: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [highlightSet, setHighlightSet] = useState(() => new Set());
  const [highlightMode, setHighlightMode] = useState(''); // '', 'type', 'date', 'range'

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
      const { items, pagination } = await getViolations({
        page,
        limit,
        search: searchQuery,
        date: dateFilter || undefined,
        from: rangeFilter.from || undefined,
        to: rangeFilter.to || undefined,
        type: typeFilter || undefined,
      });
      setRows(Array.isArray(items) ? items : []);
      if (pagination) setPageMeta(pagination);
    } catch (e) {
      setError(e?.message || 'Failed to load violations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // parse filters from URL
    try {
      const sp = new URLSearchParams(location.search);
      const s = (sp.get('search') || '').trim();
      const d = (sp.get('date') || '').trim();
      const f = (sp.get('from') || '').trim();
      const t = (sp.get('to') || '').trim();
      const vt = (sp.get('type') || '').trim();
      const hl = (sp.get('hl') || '').trim();
      setSearchQuery(s);
      setDateFilter(d);
      setRangeFilter({ from: f, to: t });
      setTypeFilter(vt);
      setHighlightMode(hl);
    } catch (_) {}
    setPage(1);
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => window.removeEventListener('parking-change', handler);
  }, [location.search]);

  // Reload when filters change (ensures state is applied before fetching)
  useEffect(() => {
    // Reset to first page on filter changes
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dateFilter, rangeFilter.from, rangeFilter.to, typeFilter]);

  // Reload when page/limit or filters change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery, dateFilter, rangeFilter.from, rangeFilter.to, typeFilter]);

  // Compute which rows should be highlighted based on current filters
  // Convert DB timestamp string to local YYYY-MM-DD safely
  const toLocalYMD = (s) => {
    try {
      const str = String(s || '');
      if (!str) return '';
      const norm = str.includes('T') ? str : str.replace(' ', 'T');
      const d = new Date(norm);
      if (Number.isNaN(d.getTime())) return str.slice(0, 10);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      const str = String(s || '');
      return str.slice(0, 10);
    }
  };

  const computeHighlights = useMemo(() => {
    const s = (searchQuery || '').toLowerCase();
    const d = (dateFilter || '').slice(0, 10);
    const f = (rangeFilter.from || '').slice(0, 10);
    const t = (rangeFilter.to || '').slice(0, 10);
    const vt = typeFilter || '';
    return (list) => {
      const set = new Set();
      list.forEach((r) => {
        const vDate = (r.violation_date || '').slice(0, 10);
        const vLocal = toLocalYMD(r.violation_date);
        const vType = r.violation_type || '';
        const veNo = (r.ve_number || '').toLowerCase();
        const loc = (r.parking_loc || '').toLowerCase();
        let match = false;
        // Explicit highlight mode takes precedence
        if (highlightMode === 'type' && vt) {
          match = vType === vt;
        } else if (highlightMode === 'date' && d) {
          // Compare by local day so what user sees matches highlight
          match = vLocal === d;
        } else if (highlightMode === 'range' && f && t) {
          // Compare local day within the provided date bounds
          match = (vLocal >= f && vLocal <= t);
        } else {
          // Fallback heuristic
          if (vt) match ||= vType === vt;
          if (d) match ||= (vLocal === d);
          if (f && t) match ||= (vLocal >= f && vLocal <= t);
          if (!vt && !d && !(f && t) && s) match ||= (veNo.includes(s) || loc.includes(s));
        }
        if (match) set.add(r.violation_idx);
      });
      return set;
    };
  }, [searchQuery, dateFilter, rangeFilter.from, rangeFilter.to, typeFilter, highlightMode]);

  // Apply highlight shortly after rows load
  useEffect(() => {
    if (!rows || rows.length === 0) { setHighlightSet(new Set()); return; }
    const set = computeHighlights(rows);
    setHighlightSet(set);
    if (set.size > 0) {
      const id = setTimeout(() => setHighlightSet(new Set()), 2500);
      return () => clearTimeout(id);
    }
  }, [rows, computeHighlights]);

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
                      <tr key={r.violation_idx} className={highlightSet.has(r.violation_idx) ? 'highlight-blink' : ''}>
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
            {!loading && !error && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="all-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
                  <button className="all-btn" disabled={page >= (pageMeta.totalPages || 1)} onClick={() => setPage((p) => Math.min(pageMeta.totalPages || 1, p + 1))}>다음</button>
                </div>
                <div style={{ color: '#c9d1d9', fontSize: 12 }}>
                  페이지 {pageMeta.currentPage || page} / {pageMeta.totalPages || 1} · 총 {pageMeta.totalItems || rows.length}건
                </div>
              </div>
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
