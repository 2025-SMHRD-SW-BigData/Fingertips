import React, { useEffect, useState } from 'react';
import { listParkingLogs } from '../services/api';
import Sidebar from '../component/Sidebar';
import MainpageTop from '../component/MainpageTop';
import Logo from '../component/Logo';
import SidebarLayout from '../ui/SidebarLayout';
import ParkingControls from '../component/ParkingControls';
import LogDetailsModal from '../component/LogDetailsModal'; // Import modal
import { useNavigate } from 'react-router-dom';
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
  const [page, setPage] = useState(1);
  const pageSize = 5; // page size for server pagination
  const [pageMeta, setPageMeta] = useState({ totalItems: 0, pageSize: 5, currentPage: 1, totalPages: 1 });
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const navigate = useNavigate();

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
    const load = async (targetPage = page) => {
      try {
        const { items, pagination } = await listParkingLogs({ page: targetPage, limit: pageSize });
        if (!mounted) return;
        setRows(Array.isArray(items) ? items : []);
        if (pagination) setPageMeta(pagination);

        // Auto-correct page if out of range
        if (items.length === 0 && targetPage > 1 && pagination && pagination.totalItems > 0) {
          const actualTotalPages = Math.max(1, Math.ceil(pagination.totalItems / pageSize));
          if (targetPage > actualTotalPages) {
            setPage(actualTotalPages);
            return load(actualTotalPages);
          }
        }
        setPage(targetPage);
      } catch (err) {
        console.error('Failed to load parking logs (paginated)', err);
        if (mounted) {
          setRows([]);
          setPageMeta({ totalItems: 0, pageSize, currentPage: 1, totalPages: 1 });
          setPage(1);
        }
      }
    };
    load(1);
    const onParking = () => load(1);
    const onDistrict = () => load(1);
    window.addEventListener('parking-change', onParking);
    window.addEventListener('district-change', onDistrict);
    return () => {
      mounted = false;
      window.removeEventListener('parking-change', onParking);
      window.removeEventListener('district-change', onDistrict);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when page changes
  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      try {
        const { items, pagination } = await listParkingLogs({ page, limit: pageSize });
        if (cancelled) return;
        setRows(Array.isArray(items) ? items : []);
        if (pagination) setPageMeta(pagination);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load parking logs (page change)', err);
        setRows([]);
      }
    };
    reload();
    return () => { cancelled = true; };
  }, [page]);

  // Derived pagination values from server
  const totalItems = pageMeta.totalItems || 0;
  const totalPages = pageMeta.totalPages || Math.max(1, Math.ceil((totalItems || 0) / pageSize));
  const currentPage = pageMeta.currentPage || page;

  return (
    <SidebarLayout className="Mainpage_box">
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
          {rows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="all-btn" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
                <button className="all-btn" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
              </div>
              <div style={{ color: '#c9d1d9', fontSize: 12 }}>
                페이지 {currentPage} / {totalPages} · 총 {totalItems}건
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '20px' }}>
            <button 
              onClick={() => navigate('/dashboard')}
              style={{ 
                padding: '10px 24px',
                fontSize: '14px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                minWidth: '150px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
              }}
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
      <LogDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        log={selectedLog}
      />
    </SidebarLayout>
  );
};

export default InOutPage;
