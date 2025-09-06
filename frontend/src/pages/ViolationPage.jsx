import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import SidebarLayout from '../ui/SidebarLayout';
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
  const [limit, setLimit] = useState(5);
  const [pageMeta, setPageMeta] = useState({ totalItems: 0, pageSize: 5, currentPage: 1, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState({ from: '', to: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [highlightSet, setHighlightSet] = useState(() => new Set());
  const [highlightMode, setHighlightMode] = useState(''); // '', 'type', 'date', 'range'

  const statusClass = useMemo(() => (val) => {
    const raw = String(val || '').toLowerCase();
    if (!raw) return 'chip';
    // Map common admin_status and variants to chip colors
    if (raw.includes('미처리')) return 'chip'; // 미처리는 기본 회색
    if (raw.includes('중') || raw.includes('계도') || raw.includes('progress')) return 'chip orange'; // 처리중/계도방송
    if (raw.includes('대기') || raw.includes('보류') || raw.includes('pending') || raw.includes('검토')) return 'chip purple';
    if (raw.includes('완료') || raw.includes('확정') || raw.includes('confirmed') || raw.includes('경고') || raw.includes('위반')) return 'chip red';
    return 'chip';
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalChoice, setModalChoice] = useState('');
  const [modalMemo, setModalMemo] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = async (targetPage = page, isAutoRedirect = false) => {
    setLoading(true);
    setError('');
    
    // URL에서 직접 파라미터를 읽어와서 사용 (상태 업데이트 지연 문제 해결)
    const sp = new URLSearchParams(location.search);
    const urlSearch = (sp.get('search') || '').trim();
    const urlDate = (sp.get('date') || '').trim();
    const urlFrom = (sp.get('from') || '').trim();
    const urlTo = (sp.get('to') || '').trim();
    const urlType = (sp.get('type') || '').trim();
    
    const params = {
      page: targetPage,
      limit,
      search: urlSearch || searchQuery,
      date: urlDate || dateFilter || undefined,
      from: urlFrom || rangeFilter.from || undefined,
      to: urlTo || rangeFilter.to || undefined,
      type: urlType || typeFilter || undefined,
    };
    
    console.log('[ViolationPage] API 호출 파라미터 (URL 우선):', params);
    console.log('[ViolationPage] 현재 URL:', location.search);
    
    try {
      const { items, pagination } = await getViolations(params);
      console.log('[ViolationPage] API 응답:', { items: items?.length, pagination });
      
      setRows(Array.isArray(items) ? items : []);
      if (pagination) setPageMeta(pagination);
      
      // 데이터가 없고 1페이지가 아닌 경우, 자동 리다이렉트 방지를 위한 조건 추가
      if (items.length === 0 && targetPage > 1 && pagination && pagination.totalItems > 0 && !isAutoRedirect) {
        const actualTotalPages = Math.max(1, Math.ceil(pagination.totalItems / limit));
        if (targetPage > actualTotalPages) {
          // 마지막 페이지로 이동 (재귀 방지를 위해 isAutoRedirect = true)
          setPage(actualTotalPages);
          return load(actualTotalPages, true);
        }
      }
      
      setPage(targetPage);
    } catch (e) {
      setError(e?.message || 'Failed to load violations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Parse URL parameters and load data immediately
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const s = (sp.get('search') || '').trim();
      const d = (sp.get('date') || '').trim();
      const f = (sp.get('from') || '').trim();
      const t = (sp.get('to') || '').trim();
      const vt = (sp.get('type') || '').trim();
      const hl = (sp.get('hl') || '').trim();
      
      console.log('[ViolationPage] URL 변경 감지:', location.search);
      console.log('[ViolationPage] 파싱된 필터:', { s, d, f, t, vt, hl });
      
      // 상태 업데이트
      setSearchQuery(s);
      setDateFilter(d);
      setRangeFilter({ from: f, to: t });
      setTypeFilter(vt);
      setHighlightMode(hl);
      setPage(1); // 페이지 리셋
      
      // URL 변경 시 즉시 데이터 로딩 (상태 업데이트 지연 문제 해결)
      console.log('[ViolationPage] URL 변경으로 인한 즉시 로딩 실행');
      load(1);
      
    } catch (err) {
      console.error('[ViolationPage] URL 파싱 오류:', err);
    }
    
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => window.removeEventListener('parking-change', handler);
  }, [location.search]);

  // Load data when page or limit changes (필터 변경은 위의 useEffect에서 처리)
  useEffect(() => {
    console.log('[ViolationPage] 페이지/제한 변경으로 인한 로딩 트리거:', { page, limit });
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

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
    <SidebarLayout className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header with-controls">
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
                    const isDone = /완료|확정|confirmed|종결|완료됨/.test(String(r.admin_status || '').toLowerCase());
                    const isCompleted = isDone;
                    const busy = !!marking[r.violation_idx];
                    const rowCls = [
                      highlightSet.has(r.violation_idx) ? 'highlight-blink' : '',
                      isCompleted ? 'processed' : 'pending',
                    ].filter(Boolean).join(' ');
                    return (
                      <tr key={r.violation_idx} className={rowCls}>
                        <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{r.ve_number}</td>
                        <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{r.parking_loc || r.space_id || '-'}</td>
                        <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{r.violation_type || '-'}</td>
                        <td style={{ color: isCompleted ? '#9aa0a6' : 'inherit' }}>{formatTime(r.violation_date)}</td>
                        <td>
                          <span className={statusClass(r.admin_status || '미처리')}>
                            {r.admin_status || '미처리'}
                          </span>
                        </td>
                        <td>
                          {isCompleted ? (
                            <span style={{ color: '#9aa0a6' }}>-</span>
                          ) : (
                            <button className="action-btn" disabled={busy} onClick={() => openModal(r.violation_idx)}>
                              {busy ? '처리 중…' : '검토'}
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
    </SidebarLayout>
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
          <button onClick={onConfirm} disabled={busy || !choice} className="action-btn">{busy ? '처리 중…' : '검토'}</button>
        </div>
      </div>
    </div>
  );
};

export default ViolationPage;
