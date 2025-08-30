import React, { useState, useEffect } from 'react';
import '../style/mainpage.css';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import { getAlerts, updateAlert } from '../services/api';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState({});
  const [markingAll, setMarkingAll] = useState(false);

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
        const rows = await getAlerts(adminId, { status: 'all' });
        if (!mounted) return;
        setNotifications(Array.isArray(rows) ? rows : []);
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

  return (
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header">
            <h1>알림 내역</h1>
            <button className="all-btn" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? '처리 중…' : '전체 읽음 처리'}
            </button>
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
                    <th>메시지</th>
                    <th>유형</th>
                    <th>시간</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => {
                    const isUnread = !n.read_at;
                    const busy = !!marking[n.alert_idx];
                    return (
                      <tr key={n.alert_idx}>
                        <td>{n.alert_msg}</td>
                        <td>{n.alert_type || '-'}</td>
                        <td>{n.sent_at ? new Date(n.sent_at).toLocaleString() : '-'}</td>
                        <td>{isUnread ? '미읽음' : '읽음'}</td>
                        <td>
                          {isUnread ? (
                            <button className="action-btn" disabled={busy} onClick={() => handleMarkRead(n.alert_idx)}>
                              {busy ? '처리 중…' : '읽음 처리'}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
