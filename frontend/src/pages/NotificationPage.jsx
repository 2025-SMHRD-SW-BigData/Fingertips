import React, { useState, useEffect } from 'react';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import SidebarLayout from '../ui/SidebarLayout';
import ParkingControls from '../component/ParkingControls';
import { getAlerts, updateAlert } from '../services/api';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState({});
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5; // fixed page size (no selector)

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const adminId = localStorage.getItem('admin_id');
        if (!adminId) {
          if (mounted) {
            setNotifications([]);
            setError('관리자 ID가 없습니다. 다시 로그인해 주세요.');
          }
          return;
        }
        const rawIdx = localStorage.getItem('parking_idx');
        const parkingIdx = rawIdx ? parseInt(rawIdx, 10) : null;
        const rows = await getAlerts(adminId, { status: 'all', parkingIdx });
        if (!mounted) return;
        setNotifications(Array.isArray(rows) ? rows : []);
        setPage(1); // reset to first page on reload
      } catch (err) {
        if (mounted) setError(err?.message || '알림을 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Reload alerts when parking/district selection changes
  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      try {
        setLoading(true);
        setError('');
        const adminId = localStorage.getItem('admin_id');
        if (!adminId) {
          if (!cancelled) {
            setNotifications([]);
          }
          return;
        }
        const rawIdx = localStorage.getItem('parking_idx');
        const parkingIdx = rawIdx ? parseInt(rawIdx, 10) : null;
        const rows = await getAlerts(adminId, { status: 'all', parkingIdx });
        if (!cancelled) {
          setNotifications(Array.isArray(rows) ? rows : []);
          setPage(1);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || '알림을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const onParking = () => reload();
    const onDistrict = () => reload();
    window.addEventListener('parking-change', onParking);
    window.addEventListener('district-change', onDistrict);
    return () => {
      cancelled = true;
      window.removeEventListener('parking-change', onParking);
      window.removeEventListener('district-change', onDistrict);
    };
  }, []);

  const handleMarkRead = async (id) => {
    if (!id) return;
    setMarking((m) => ({ ...m, [id]: true }));
    try {
      await updateAlert(id, { read: true });
      setNotifications((prev) => prev.map((n) => (n.alert_idx === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)));
      try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
    } catch (err) {
      // optionally surface error
    } finally {
      setMarking((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.alert_idx);
    if (!unreadIds.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(
        unreadIds.map((id) => updateAlert(id, { read: true }).catch(() => null))
      );
      setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
      try { window.dispatchEvent(new CustomEvent('alerts-updated')); } catch (_) {}
    } finally {
      setMarkingAll(false);
    }
  };

  const totalItems = notifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pageItems = notifications.slice(pageStart, pageEnd);

  return (
    <SidebarLayout className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header with-controls">
            <h1>알림 내역</h1>
            <div className="notif-tools">
              <ParkingControls />
              <button className="all-btn" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? '처리 중…' : '전체 읽음 처리'}
            </button>
            </div>
          </div>
          <div className="notification-list">
            {loading && <p>불러오는 중…</p>}
            {!loading && error && <p style={{ color: 'tomato' }}>{error}</p>}
            {!loading && !error && notifications.length === 0 && (
              <p>표시할 알림이 없습니다.</p>
            )}
            {!loading && !error && notifications.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>메시지</th>
                    <th style={{ width: '10%' }}>유형</th>
                    <th style={{ width: '20%' }}>시간</th>
                    <th style={{ width: '8%' }}>형태</th>
                    <th style={{ width: '12%' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((n) => {
                    const isUnread = !n.read_at;
                    const isRead = !isUnread;
                    const busy = !!marking[n.alert_idx];
                    return (
                      <tr key={n.alert_idx} className={isUnread ? 'unread' : ''}>
                        <td style={{ color: isRead ? '#9aa0a6' : 'inherit' }}>{n.alert_msg}</td>
                        <td style={{ color: isRead ? '#9aa0a6' : 'inherit' }}>{n.alert_type || '-'}</td>
                        <td style={{ color: isRead ? '#9aa0a6' : 'inherit' }}>{n.sent_at ? new Date(n.sent_at).toLocaleString() : '-'}</td>
                        <td style={{ color: isRead ? '#9aa0a6' : 'inherit' }}>{isUnread ? '미읽음' : '읽음'}</td>
                        <td>
                          {isUnread ? (
                            <button className="action-btn" disabled={busy} onClick={() => handleMarkRead(n.alert_idx)}>
                              {busy ? '처리 중' : '읽음 처리'}
                            </button>
                          ) : (
                            <span style={{ color: '#9aa0a6' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && !error && notifications.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="all-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
                  <button className="all-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
                </div>
                <div style={{ color: '#c9d1d9', fontSize: 12 }}>
                  페이지 {currentPage} / {totalPages} · 총{totalItems}건                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default NotificationPage;
