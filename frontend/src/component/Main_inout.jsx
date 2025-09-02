import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import "../style/mainpage.css";
import { getParkingLogs } from '../services/api';

const formatTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};

const Main_inout = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      getParkingLogs()
        .then((data) => {
          if (mounted) setRows(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error('Failed to load parking logs', err));
    };
    load();
    const handler = () => load();
    window.addEventListener('parking-change', handler);
    return () => {
      mounted = false;
      window.removeEventListener('parking-change', handler);
    };
  }, []);

  return (
    <div className='inout box-style'>
      <div className="header">
        <h3>입·출차 기록</h3>
        <Link to="/inout" className="all-btn">전체 보기</Link>
      </div>
      <table className="data-table">
        <colgroup>
          <col style={{width: "25%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "15%"}} />
        </colgroup>
        <thead>
          <tr>
            <th>차량번호</th>
            <th>구역</th>
            <th>입차</th>
            <th>출차</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.log_idx}>
              <td>{row.ve_number}</td>
              <td>{row.space_id}</td>
              <td>{formatTime(row.entry_at)}</td>
              <td>{formatTime(row.exit_at)}</td>
              <td>
                <button className="action-btn">보기</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: '#ccc' }}>표시할 데이터가 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Main_inout;
