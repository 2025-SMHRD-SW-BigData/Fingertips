import React, { useEffect, useState } from 'react';
import "../style/mainpage.css";
import { getRecentViolations } from '../services/api';
import { Link } from 'react-router-dom';

const formatTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};

const Mainpage_vio = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    getRecentViolations()
      .then((data) => {
        if (mounted) setRows(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to load recent violations', err));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className='vio box-style'>
      <div className="header">
        <h3>최근 위반</h3>
        <Link to="/violations" className="all-btn" style={{ textDecoration: 'none' }} >전체 보기</Link>
      </div>
      <table className="data-table">
        <colgroup>
          <col style={{width: "25%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "10%"}} />
        </colgroup>
        <thead>
          <tr>
            <th>차량번호</th>
            <th>구역</th>
            <th>사유</th>
            <th>시각</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.violation_idx}>
              <td>{row.ve_number}</td>
              <td>{row.parking_loc}</td>
              <td>{row.violation_type}</td>
              <td>{formatTime(row.violation_date)}</td>
              <td>
                <span className={`status ${row.admin_status || '미처리'}`}>{row.admin_status || '미처리'}</span>
              </td>
              <td>
                <button className="action-btn">보기</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#ccc' }}>표시할 데이터가 없습니다</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Mainpage_vio;

