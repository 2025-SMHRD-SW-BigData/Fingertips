import React, { useState, useRef, useEffect } from 'react'; // useState, useRef, useEffect import
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

    const parkingLotData = {
        'a주차장': [
            { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
            { id: 2, name: '주차장 전체 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone_highview.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
            { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone3.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
            { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone2.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' }
        ],
        'b주차장': [
            { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_venu.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
            { id: 2, name: '주차장 전체 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_venu2.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' },
            { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/hg_venu3.mp4' ,modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4'},
            { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/ts_zombie.mp4',modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' }
        ],
        'c주차장': [
            { id: 1, name: '입구', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4' ,modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4'},
            { id: 2, name: '주차장 전체 뷰', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone_highview.mp4' ,modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4'},
            { id: 3, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone3.mp4' ,modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4'},
            { id: 4, name: '장애인주차구역', src: 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jw_drone2.mp4' ,modalSrc : 'https://binarywooforum1.s3.ap-northeast-2.amazonaws.com/jh2.mp4'}
        ],
    };
    const [selectedParkingLot, setSelectedParkingLot] = useState(Object.keys(parkingLotData)[0]);

    const cctvFeeds = parkingLotData[selectedParkingLot];

    if (videoRefs.current.length !== cctvFeeds.length) {
        videoRefs.current = Array(cctvFeeds.length).fill(0).map((_, i) => videoRefs.current[i] || React.createRef());
    }

    const openModal = (src, index) => {
        const videoElement = videoRefs.current[index].current;
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

    const handleParkingLotChange = (event) => {
        setSelectedParkingLot(event.target.value);
    };

    return (
        <div className="cctv-management-container">
            <div className="cctv-header">
                <h1>CCTV 실시간 영상</h1>
                <select onChange={handleParkingLotChange} value={selectedParkingLot} className="parking-lot-selector">
                    {Object.keys(parkingLotData).map(lotName => (
                        <option key={lotName} value={lotName}>{lotName}</option>
                    ))}
                </select>
            </div>
            <div className="cctv-grid-container">
                {cctvFeeds.map((feed, index) => (
                    <div key={feed.id} className="cctv-feed-item" onClick={() => openModal(feed.modalSrc, index)}>
                        <h3 className="video-title">{feed.name}</h3>
                        <video
                            ref={videoRefs.current[index]}
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
