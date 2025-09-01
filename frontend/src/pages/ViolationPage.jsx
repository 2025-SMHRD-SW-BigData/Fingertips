import React, { useState, useEffect } from 'react';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ParkingControls from '../component/ParkingControls';
import { getViolations, updateViolation } from '../services/api';

const formatTime = (iso) => {
  if (!iso) return '-';
  try { return new Date(iso).toLocaleString(); } catch { return '-'; }
};

const ViolationPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await getViolations({ page: 1, limit: 20 });
      setRows(Array.isArray(items) ? items : []);
    } catch (e) {
      setError(e?.message || 'Failed to load violations');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => window.removeEventListener('parking-change', handler);
  }, []);

  const handleConfirm = async (id) => {
    if (!id) return;
    setMarking((m) => ({ ...m, [id]: true }));
    try {
      await updateViolation(id, { admin_status: '확인' });
      setRows((prev) => prev.map((r) => (r.violation_idx === id ? { ...r, admin_status: r.admin_status || '확인' } : r)));
    } catch (e) {
      // Optionally surface error UI
    } finally {
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
                            <button className="action-btn" disabled={busy} onClick={() => handleConfirm(r.violation_idx)}>
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
      </div>
    </div>
  );
};

export default ViolationPage;
