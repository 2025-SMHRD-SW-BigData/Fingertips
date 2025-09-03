import React, { useState, useEffect } from 'react';
import Logo from '../component/Logo';
import MainpageTop from '../component/MainpageTop';
import Sidebar from '../component/Sidebar';
import '../style/LiveStreamPage.css'; // 이 CSS 파일도 새로 만들겠습니다.

const LiveStreamPage = () => {
    const [videoSrc, setVideoSrc] = useState('');
    const [stats, setStats] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const WEBSOCKET_URL = 'ws://fingertips-env.eba-pbxevwfi.ap-northeast-2.elasticbeanstalk.com/';
        const socket = new WebSocket(WEBSOCKET_URL);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                // 서버로부터 받은 데이터는 항상 JSON 문자열입니다.
                const data = JSON.parse(event.data);

                // JSON 객체에서 videoFrame(데이터 URI)을 추출하여 비디오 소스를 업데이트합니다.
                if (data.videoFrame) {
                    setVideoSrc(data.videoFrame);
                }

                // JSON 객체에서 results를 추출하여 통계 정보를 업데이트합니다.
                if (data.results) {
                    setStats(data.results);
                }
            } catch (error) {
                console.error('Error parsing WebSocket JSON message:', error);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        // 컴포넌트가 언마운트될 때 정리
        return () => {
            setVideoSrc(prevSrc => {
                if (prevSrc) {
                    URL.revokeObjectURL(prevSrc);
                }
                return '';
            });
            socket.close();
        };
    }, []);

    return (
        <div className="Mainpage_box">
            <div className="page-layout-simple">
                <Logo />
                <MainpageTop />
                <Sidebar />
                <div className="content-area">
                    <div className="live-stream-content">
                        <h1>실시간 라즈베리파이 영상</h1>
                        <div className="live-video-wrapper">
                            {isConnected && videoSrc ? (
                                <img src={videoSrc} alt="Live Stream from Pi" />
                            ) : (
                                <div className="status-overlay">
                                    <p>라즈베리파이 서버에 연결 중...</p>
                                    <p>(백엔드 및 라즈베리파이 스트리밍 스크립트가 실행 중인지 확인하세요)</p>
                                </div>
                            )}
                            {isConnected && videoSrc && stats && (
                                <div className="live-stats-overlay">
                                    <p>감지된 객체: {stats.detectionCount}</p>
                                    <p>상태: {stats.status}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveStreamPage;
