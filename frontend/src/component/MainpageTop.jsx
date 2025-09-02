import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/mainpage.css';
import search from '../assets/search.png';
import bell from '../assets/bell.png';
import { getUnreadAlerts, getAlerts, getViolations } from '../services/api';
import ParkingControls from './ParkingControls';

const MainpageTop = ({ showParkingControls = false }) => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminName') || localStorage.getItem('admin_id') || 'Admin';

  const [now, setNow] = useState(new Date());
  // No parking controls here; moved into page content
  const [unreadCount, setUnreadCount] = useState(0);
  const [openBell, setOpenBell] = useState(false);
  const [unreadList, setUnreadList] = useState([]);
  const [loadingDrop, setLoadingDrop] = useState(false);
  const bellRef = React.useRef(null);

  // Search state
  const [q, setQ] = useState('');
  const [openSearch, setOpenSearch] = useState(false);
  const [suggests, setSuggests] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const searchRef = React.useRef(null);
  const debounceRef = React.useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // (parking controls moved into page content)

  useEffect(() => {
    let active = true;
    const adminId = localStorage.getItem('admin_id');
    if (!adminId) {
      setUnreadCount(0);
      return () => { active = false; };
    }
    const load = () => {
      getUnreadAlerts(adminId)
        .then((rows) => {
          if (active) setUnreadCount(Array.isArray(rows) ? rows.length : 0);
        })
        .catch(() => {
          if (active) setUnreadCount(0);
        });
    };
    load();
    // Optional: light polling to keep fresh
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Refresh unread count when notifications are updated elsewhere
  useEffect(() => {
    const handler = () => {
      const adminId = localStorage.getItem('admin_id');
      if (!adminId) {
        setUnreadCount(0);
        return;
      }
      getUnreadAlerts(adminId)
        .then((rows) => setUnreadCount(Array.isArray(rows) ? rows.length : 0))
        .catch(() => setUnreadCount(0));
    };
    window.addEventListener('alerts-updated', handler);
    const onParking = () => handler();
    const onDistrict = () => handler();
    window.addEventListener('parking-change', onParking);
    window.addEventListener('district-change', onDistrict);
    return () => {
      window.removeEventListener('alerts-updated', handler);
      window.removeEventListener('parking-change', onParking);
      window.removeEventListener('district-change', onDistrict);
    };
  }, []);

  // Bell dropdown: toggle, fetch unread when opened, outside click/Esc to close
  useEffect(() => {
    if (!openBell) return;
    let alive = true;
    const adminId = localStorage.getItem('admin_id');
    if (!adminId) return;
    setLoadingDrop(true);
    getAlerts(adminId, { status: 'unread' })
      .then((rows) => {
        if (alive) setUnreadList(Array.isArray(rows) ? rows.slice(0, 10) : []);
      })
      .finally(() => alive && setLoadingDrop(false));
    const onDocClick = (e) => {
      const el = bellRef.current;
      if (el && !el.contains(e.target)) setOpenBell(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpenBell(false); };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      alive = false;
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [openBell]);

  // Search: debounce suggestions and handle outside click/Esc
  useEffect(() => {
    const text = (q || '').trim();
    if (text.length < 2) {
      setSuggests([]);
      setOpenSearch(false);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    const token = Date.now();
    debounceRef.current = token;
    const t = setTimeout(async () => {
      try {
        const { items } = await getViolations({ page: 1, limit: 5, search: text });
        if (debounceRef.current !== token) return; // stale
        setSuggests(Array.isArray(items) ? items : []);
        setOpenSearch(true);
      } catch (_) {
        if (debounceRef.current !== token) return;
        setSuggests([]);
        setOpenSearch(true);
      } finally {
        if (debounceRef.current === token) setLoadingSuggest(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!openSearch) return;
    const onDoc = (e) => {
      const el = searchRef.current;
      if (el && !el.contains(e.target)) setOpenSearch(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpenSearch(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [openSearch]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('adminName');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('role');
    } catch (e) {
      // ignore storage errors
    }
    navigate('/login', { replace: true });
  };

  // (no district/parking handlers in top bar)

  const formatNow = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  };

  return (
    <div className={`Top_box box-style${showParkingControls ? ' has-controls' : ''}`}>
      <div className="search-container" ref={searchRef}>
        <img src={search} alt="Search" className="search-icon" />
        <input
          type="text"
          placeholder="차량번호 검색"
          className="serch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if ((q || '').trim().length >= 2) setOpenSearch(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const kw = (q || '').trim();
              if (kw.length >= 1) {
                setOpenSearch(false);
                navigate(`/violations?search=${encodeURIComponent(kw)}`);
              }
            }
          }}
        />
        {openSearch && (
          <div className="search-suggest">
            <div className="search-suggest-header">Search results</div>
            {loadingSuggest ? (
              <div className="search-suggest-empty">Loading…</div>
            ) : suggests.length === 0 ? (
              <div className="search-suggest-empty">No matches</div>
            ) : (
              <ul className="search-suggest-list">
                {suggests.map((it) => (
                  <li key={it.violation_idx} className="search-suggest-item">
                    <button
                      type="button"
                      onClick={() => {
                        const kw = it.ve_number || it.parking_loc || (q || '').trim();
                        setOpenSearch(false);
                        navigate(`/violations?search=${encodeURIComponent(kw)}`);
                      }}
                    >
                      <span className="suggest-main">{it.ve_number || 'Vehicle'}</span>
                      <span className="suggest-sub">{it.parking_loc || it.violation_type || ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="top-bar-widgets">
        <div className='today'>
          {formatNow(now)}
        </div>
        <div className='manager'>
          Admin: {adminName}
        </div>
        {showParkingControls && (
          <div className="profile-group">
            <ParkingControls />
          </div>
        )}
        <div className='top-bell' ref={bellRef}>
          <button
            type="button"
            className='Noti'
            onClick={() => setOpenBell((v) => !v)}
            title="Notifications"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
            aria-expanded={openBell}
            aria-haspopup="listbox"
          >
            <img src={bell} alt="Notifications" style={{ width: '20px' }} />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount}
              </span>
            )}
          </button>
          {openBell && (
            <div className="bell-dropdown" role="listbox" aria-label="Unread notifications">
              <div className="bell-dropdown-header">미확인 알림</div>
              {loadingDrop ? (
                <div className="bell-dropdown-empty">Loading…</div>
              ) : unreadList.length === 0 ? (
                <div className="bell-dropdown-empty">미확인 알림이 없습니다.</div>
              ) : (
                <ul className="bell-dropdown-list">
                  {unreadList.map((n) => (
                    <li key={n.alert_idx} className="bell-dropdown-item">
                      <div className="bell-item-title">{n.alert_msg || 'Notification'}</div>
                      <div className="bell-item-meta">{n.sent_at ? new Date(n.sent_at).toLocaleString() : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="bell-dropdown-footer">
                <button className="all-btn" onClick={() => navigate('/notifications')}>View all</button>
              </div>
            </div>
          )}
        </div>
        <div className='login_out'>
          <button onClick={handleLogout} className='logout-btn'>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default MainpageTop;
