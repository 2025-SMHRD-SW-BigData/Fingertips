import React, { useEffect, useState } from 'react';
import { getParkingLogs } from '../services/api';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import ParkingControls from '../component/ParkingControls';
import LogDetailsModal from '../component/LogDetailsModal'; // Import modal
import '../style/mainpage.css';

const formatTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '-';
  }
};

const InOutPage = () => {
  const [rows, setRows] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const handleOpenModal = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLog(null);
  };

  useEffect(() => {
    let mounted = true;
    const load = () => {
      getParkingLogs()
        .then((data) => {
          console.log('Parking logs data:', data); // Log the data
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
    <div className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <div className="header with-controls">
            <h1>입·출차 기록</h1>
            <div className="notif-tools">
              <ParkingControls />
            </div>
          </div>
          <table className="data-table">
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
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
                    <button className="action-btn" onClick={() => handleOpenModal(row)}>보기</button>
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
      </div>
      <LogDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        log={selectedLog}
      />
    </div>
  );
};

export default InOutPage;
