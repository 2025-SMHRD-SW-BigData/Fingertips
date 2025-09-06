import React from 'react';
import '../style/LogDetailsModal.css';

const formatTime = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleString([], {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch {
    return '-';
  }
};

const LogDetailsModal = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-body">
          {/* 사진 왼쪽 */}
          <div className="image-container">
            {log.ve_img ? (
              <img src={log.ve_img} alt={`차량 이미지 ${log.ve_number}`} />
            ) : (
              <div className="no-image">이미지 없음</div>
            )}
          </div>

          {/* 글 오른쪽 */}
          <div className="info-container">
            <hr/>
            <p><strong>차량번호:</strong> {log.ve_number}</p><hr/>
            <p><strong>입차 시간:</strong> {formatTime(log.entry_at)}</p><hr/>
            <p><strong>출차 시간:</strong> {formatTime(log.exit_at)}</p><hr/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailsModal;
