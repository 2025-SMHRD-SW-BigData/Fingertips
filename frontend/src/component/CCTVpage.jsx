import React, { useState } from 'react'; // useState import
import '../style/mainpage.css';
import '../style/CCTVpage.css';
import Sidebar from './Sidebar';
import MainpageTop from './MainpageTop';
import Logo from './Logo';

const CCTVManagement = () => {
    const [modalSrc, setModalSrc] = useState(null); // 모달에 표시할 영상 소스 state

    // 영상 데이터
    const cctvFeeds = [
        { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
        { id: 2, name: '주차장 전체 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone_highview.mp4' },
        { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone3.mp4' },
        { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone2.mp4' },
    ];

    // 모달 열기 함수
    const openModal = (src) => {
        setModalSrc(src);
    };

    // 모달 닫기 함수
    const closeModal = () => {
        setModalSrc(null);
    };

    return (
        <div className="cctv-management-container">
            <h1>CCTV 실시간 영상</h1>
            <div className="cctv-grid-container">
                {cctvFeeds.map((feed) => (
                    <div key={feed.id} className="cctv-feed-item" onClick={() => openModal(feed.src)}>
                        <h3 className="video-title">{feed.name}</h3>
                        <video
                            src={feed.src}
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ))}
            </div>

            {/* 모달 UI */}
            {modalSrc && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <video
                            src={modalSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="modal-video"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const CCTVpage = () => {
    return (
        <div className="Mainpage_box">
            <div className="page-layout-simple">
                <Logo/>
                <MainpageTop />
                <Sidebar />
                <div className="content-area">
                    <CCTVManagement />
                </div>
            </div>
        </div>
    );
};

export default CCTVpage;
