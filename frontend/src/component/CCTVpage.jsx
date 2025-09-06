import React, { useState, useRef, useEffect } from 'react';
import '../style/mainpage.css';
import '../style/CCTVpage.css';
import Sidebar from './Sidebar';
import MainpageTop from './MainpageTop';
import Logo from './Logo';
import SidebarLayout from '../ui/SidebarLayout';
import ParkingControls from './ParkingControls';

// 주차장 데이터 (이름 기반)
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

// parking_idx → 주차장 이름 매핑
const parkingIdxToName = {
    1: '광주향교주차장',
    3: 'C동 옥외주차장'
};

const CCTVManagement = () => {
    const [selectedParkingLot, setSelectedParkingLot] = useState('');
    const [modalSrc, setModalSrc] = useState(null);
    const videoRefs = useRef([]);
    const modalVideoRef = useRef(null);

    const cctvFeeds = selectedParkingLot && selectedParkingLot !== '__NO_CCTV__'
        ? (parkingLotData[selectedParkingLot] || [])
        : [];

    // 페이지 로드 시 localStorage 값으로 초기 선택
    useEffect(() => {
        const storedIdx = Number(localStorage.getItem('parking_idx'));
        if (storedIdx) {
            const lotName = parkingIdxToName[storedIdx];
            if (lotName) setSelectedParkingLot(lotName);
            else setSelectedParkingLot('__NO_CCTV__');
        }
    }, []);

    // ParkingControls 이벤트 연결
    useEffect(() => {
        const handleParkingEvent = (e) => {
            const parkingIdx = Number(e.detail);
            const lotName = parkingIdxToName[parkingIdx];
            if (lotName) setSelectedParkingLot(lotName);
            else setSelectedParkingLot('__NO_CCTV__');
        };

        window.addEventListener("parking-change", handleParkingEvent);
        return () => {
            window.removeEventListener("parking-change", handleParkingEvent);
        };
    }, []);

    const openModal = (modalSrc, index) => {
        if (videoRefs.current[index]) {
            const currentTime = videoRefs.current[index].currentTime; // CCTV 영상 현재 시간
            setModalSrc({ src: modalSrc, currentTime }); // 객체로 저장
        }
    };


    const closeModal = () => setModalSrc(null);

    useEffect(() => {
        if (modalSrc && modalVideoRef.current) {
            modalVideoRef.current.play().catch(() => { });
        }
    }, [modalSrc]);

    return (
        <div className="content-area">
            <div className="header">
                <h1>CCTV 모니터링</h1>
                <div className="notif-tools">
                    <ParkingControls />
                </div>
            </div>

            <div className="cctv-grid-container">
                {selectedParkingLot === '__NO_CCTV__' ? (
                    <div className="cctv-placeholder">
                        선택하신 주차장은 CCTV 서비스가 제공되지 않습니다.
                    </div>
                ) : selectedParkingLot && cctvFeeds.length === 0 ? (
                    <div className="cctv-placeholder">
                        선택하신 주차장은 아직 CCTV 영상이 연결되지 않았습니다.
                    </div>
                ) : (
                    cctvFeeds.map((feed, index) => (
                        <div
                            key={feed.id}
                            className="cctv-feed-item"
                            onClick={() => openModal(feed.modalSrc, index)}
                        >
                            <h3 className="video-title">{feed.name}</h3>
                            <video
                                ref={(el) => (videoRefs.current[index] = el)}
                                src={feed.src}
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        </div>
                    ))
                )}
            </div>

            {modalSrc && (
                <div className="modal-overlay" onClick={closeModal}>
                    <video
                        ref={modalVideoRef}
                        src={modalSrc.src}          // 객체에서 src 사용
                        autoPlay
                        muted
                        loop
                        className="modal-video"
                        onClick={(e) => e.stopPropagation()}
                        onLoadedMetadata={() => {
                            if (modalVideoRef.current && modalSrc.currentTime != null) {
                                modalVideoRef.current.currentTime = modalSrc.currentTime; // CCTV 영상 시간과 동기화
                                modalVideoRef.current.play().catch(() => { });
                            }
                        }}
                    />
                </div>
            )}

        </div>
    );
};

const CCTVpage = () => (
    <SidebarLayout className="Mainpage_box">
        <div className="page-layout-simple">
            <Logo />
            <MainpageTop />
            <Sidebar />
            <CCTVManagement />
        </div>
    </SidebarLayout>
);

export default CCTVpage;
