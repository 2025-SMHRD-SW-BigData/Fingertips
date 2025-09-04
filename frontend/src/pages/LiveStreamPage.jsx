import React, { useState, useEffect } from 'react';
import Logo from '../component/Logo';
import MainpageTop from '../component/MainpageTop';
import Sidebar from '../component/Sidebar';
import '../style/LiveStreamPage.css';

const LiveStreamPage = () => {
    // State to hold an array of video sources for the grid layout
    const [videoStreams, setVideoStreams] = useState([]);
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
                const data = JSON.parse(event.data);

                // When a video frame is received, update the list of streams.
                // For demonstration, we'll create a 2x2 grid by duplicating the same stream.
                // In a real application, the backend would provide multiple unique streams.
                if (data.videoFrame) {
                    // Create a dummy array of 4 video streams for layout purposes
                    setVideoStreams([
                        { id: 1, src: data.videoFrame },
                        { id: 2, src: data.videoFrame },
                        { id: 3, src: data.videoFrame },
                        { id: 4, src: data.videoFrame },
                    ]);
                }

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

        return () => {
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
                    <h1>실시간 CCTV 영상</h1>
                    {/* New container for the flexbox grid */}
                    <div className="live-video-grid">
                        {isConnected && videoStreams.length > 0 ? (
                            videoStreams.map(video => (
                                <div key={video.id} className="live-video-wrapper box-style">
                                    <img src={video.src} alt={`Live Stream ${video.id}`} />
                                    {/* Stats can be displayed per video if the backend provides them */}
                                    {stats && (
                                        <div className="live-stats-overlay">
                                            <p>Cam {video.id}</p>
                                            <p>Status: {stats.status}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            // A single placeholder for the grid
                            <div className="status-overlay-grid">
                                <p>라즈베리파이 서버에 연결 중...</p>
                                <p>(백엔드 및 라즈베리파이 스트리밍 스크립트가 실행 중인지 확인하세요)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveStreamPage;