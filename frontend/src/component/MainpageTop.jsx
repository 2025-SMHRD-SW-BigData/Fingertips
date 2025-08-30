import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/mainpage.css';
import search from '../assets/search.png';
import bell from '../assets/bell.png';
import { getParkings } from '../services/api';

const MainpageTop = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminName') || localStorage.getItem('admin_id') || 'Admin';

  const [now, setNow] = useState(new Date());
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(() => {
    const v = localStorage.getItem('parking_idx');
    const n = v ? parseInt(v, 10) : null;
    return Number.isFinite(n) ? String(n) : '';
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getParkings()
      .then((rows) => {
        if (!cancelled) setParkings(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setParkings([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleParkingChange = (e) => {
    const val = e.target.value;
    setSelectedParking(val);
    try {
      if (val) localStorage.setItem('parking_idx', String(val));
      else localStorage.removeItem('parking_idx');
    } catch (_) {}
    try {
      window.dispatchEvent(new CustomEvent('parking-change', { detail: val }));
    } catch (_) {}
    window.location.reload();
  };

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
    <div className='Top_box box-style'>
      <div className="search-container">
        <img src={search} alt="Search" className="search-icon" />
        <input
          type="text"
          placeholder="Search by plate / zone / camera name"
          className="serch"
        />
      </div>
      <div className="top-bar-widgets">
        <div className='parking-select'>
          <select value={selectedParking} onChange={handleParkingChange}>
            <option value="">ALL</option>
            {parkings.map((p) => (
              <option key={p.parking_idx} value={p.parking_idx}>
                {p.parking_loc || `Parking ${p.parking_idx}`}
              </option>
            ))}
          </select>
        </div>
        <div className='today'>
          {formatNow(now)}
        </div>
        <div className='manager'>
          Admin: {adminName}
        </div>
        <div className='Noti'>
          <img src={bell} alt="Notifications" style={{ width: '20px' }} />
        </div>
        <div className='login_out'>
          <button onClick={handleLogout} className='logout-btn'>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default MainpageTop;

