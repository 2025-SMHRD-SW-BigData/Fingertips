import React, { useState, useEffect, useRef } from 'react';
import Logo from '../component/Logo';
import MainpageTop from '../component/MainpageTop';
import Sidebar from '../component/Sidebar';
import SidebarLayout from '../ui/SidebarLayout';
import '../style/LiveStreamPage.css';

const LiveStreamPage = () => {
  const [videoStreams, setVideoStreams] = useState([]);
  const [stats, setStats] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const recBlinkRef = useRef(true); // REC 깜빡임 상태

  useEffect(() => {
    const WEBSOCKET_URL =
      'ws://fingertips-env.eba-pbxevwfi.ap-northeast-2.elasticbeanstalk.com/';
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => setIsConnected(true);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.videoFrame) {
          setVideoStreams([{ id: 1, src: data.videoFrame }]);
          frameRef.current = data.videoFrame;
        }
        if (data.results) setStats(data.results);
      } catch (error) {
        console.error(error);
      }
    };

    socket.onclose = () => setIsConnected(false);
    socket.onerror = (error) => console.error(error);

    return () => socket.close();
  }, []);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // 모달 캔버스 및 REC 깜빡임 그리기
  useEffect(() => {
    let animationFrameId;

    const draw = () => {
      if (modalOpen && canvasRef.current && frameRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.src = frameRef.current;
        img.onload = () => {
          // 영상 그리기
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);

          // 좌측 상단 REC 깜빡이기
          if (recBlinkRef.current) {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(20, 20, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('REC', 35, 25);
          }
        };
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    let blinkInterval;
    if (modalOpen) {
      animationFrameId = requestAnimationFrame(draw);
      // 500ms마다 깜빡임 토글
      blinkInterval = setInterval(() => {
        recBlinkRef.current = !recBlinkRef.current;
      }, 500);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [modalOpen]);

  return (
    <SidebarLayout className="Mainpage_box">
      <div className="page-layout-simple">
        <Logo />
        <MainpageTop />
        <Sidebar />
        <div className="content-area">
          <h1>
            <span style={{ color: 'red', fontWeight: 'bold' }}>🔴</span> 실시간 영상
          </h1>

          <div className="live-video-grid">
            {isConnected && videoStreams.length > 0 ? (
              videoStreams.map((video) => (
                <div
                  key={video.id}
                  className="live-video-wrapper box-style"
                  onClick={openModal}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={video.src} alt={`Live Stream ${video.id}`} />
                  {stats && (
                    <div className="live-stats-overlay">
                      <p>Cam {video.id}</p>
                      <p>Status: {stats.status}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="status-overlay-grid">
                <p>라즈베리파이 서버에 연결 중...</p>
                <p>(백엔드 및 라즈베리파이 스트리밍 스크립트가 실행 중인지 확인하세요)</p>
              </div>
            )}
          </div>

          {modalOpen && (
            <div className="modal-overlay" onClick={closeModal}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ padding: 0 }}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default LiveStreamPage;
