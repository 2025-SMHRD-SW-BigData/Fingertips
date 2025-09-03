import React, { useState, useRef, useEffect } from 'react';
import '../style/mainpage.css';
import '../style/CCTVpage.css';
import Sidebar from './Sidebar';
import MainpageTop from './MainpageTop';
import Logo from './Logo';

const CCTVManagement = () => {
    const [modalSrc, setModalSrc] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRefs = useRef([]);
    const modalVideoRef = useRef(null);

    // 영상 데이터
    const parkingLotData = {
        '광주향교주차장': [
            { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/entrance_venu.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/entranc_venu_good.mp4' },
            { id: 2, name: '주차장 높은 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_illegal_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_illegal.mp4' },
            { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_venu_handi_area_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_venu_handi_area.mp4' },
            { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_byungSin_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_video/hg_byungSin.mp4' }
        ],
        'C동 옥외주차장': [
            { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/entrance_jh3.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/entrance_jh3_good.mp4' },
            { id: 2, name: '주차장 높은 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/jh_highview_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/jh_highview.mp4' },
            { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/ishandi_good_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/ishandi_good.mp4' },
            { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/parking_jang_pure.mp4', modalSrc: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh_video/parking_jang.mp4' }
        ]
    };

    // 선택 상태
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedParkingLot, setSelectedParkingLot] = useState('');

    // 드롭다운 데이터
    const districts = ['남구', '동구', '서구', '북구', '광산구'];
    const parkingLotsByDistrict = {
        '남구': ['광주향교주차장'],
        '동구': ['C동 옥외주차장']
    };

    const handleDistrictChange = (e) => {
        const district = e.target.value;
        setSelectedDistrict(district);
        setSelectedParkingLot('');
    };

    const handleParkingLotChange = (e) => {
        setSelectedParkingLot(e.target.value);
    };

    const availableParkingLots = parkingLotsByDistrict[selectedDistrict] || [];
    const cctvFeeds = parkingLotData[selectedParkingLot] || [];

    const openModal = (src, index) => {
        const videoElement = videoRefs.current[index];
        if (videoElement) {
            setCurrentTime(videoElement.currentTime);
            setModalSrc(src);
        }
    };

    const closeModal = () => {
        setModalSrc(null);
    };

    useEffect(() => {
        if (modalSrc && modalVideoRef.current) {
            modalVideoRef.current.currentTime = currentTime;
            modalVideoRef.current.play().catch(error => {
                console.log("Autoplay prevented: ", error);
            });
        }
    }, [modalSrc, currentTime]);

    return (
        <div className="cctv-management-container">
            <div className="header">
                <h1>CCTV 실시간 영상</h1>
                <div className="notif-tools parking-controls">
                    <div className="parking-controls-inner">
                        <select aria-label="행정구 선택" value={selectedDistrict} onChange={handleDistrictChange}>
                            <option value="">행정구 선택</option>
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select aria-label="주차장 선택" value={selectedParkingLot} onChange={handleParkingLotChange} disabled={!selectedDistrict}>
                            {availableParkingLots.length > 0 ? (
                                <>
                                    <option value="">주차장 선택</option>
                                    {availableParkingLots.map(p => <option key={p} value={p}>{p}</option>)}
                                </>
                            ) : (
                                <option value="">주차장 정보 없음</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>
            <div className="cctv-grid-container">
                {cctvFeeds.length > 0 ? (
                    cctvFeeds.map((feed, index) => (
                        <div key={feed.id} className="cctv-feed-item" onClick={() => openModal(feed.modalSrc, index)}>
                            <h3 className="video-title">{feed.name}</h3>
                            <video
                                ref={(el) => (videoRefs.current[index] = el)}  // ✅ 안정적인 ref 할당
                                src={feed.src}
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ))
                ) : (
                    <div className="cctv-placeholder">행정구와 주차장을 선택해주세요.</div>
                )}
            </div>

            {modalSrc && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <video
                            ref={modalVideoRef}
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
    React.useEffect(() => {
        try {
            localStorage.setItem('cctv_last_visit', new Date().toISOString());
        } catch (_) {}
    }, []);
    return (
        <div className="Mainpage_box">
            <div className="page-layout-simple">
                <Logo />
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
