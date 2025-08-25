import React from 'react'
import logo from '../assets/logo.png'
import '../style/mainpage.css'

const MainpageTop = () => {
    return (
        <div className='Mainpage_top'>
            <div className="logo-container">
                <img src={logo} alt="로고" style={{ width: '50px', height: "50px", marginRight: '0px' }} />
                <span style={{fontSize:"22px",fontWeight:"bold"}}>
                    이음주차
                </span>
                <input
                    type="text"
                    placeholder="차량번호 / 구역 / 카메라 이름 검색"
                    className="serch"
                />
            </div>
        </div>
    )
}

export default MainpageTop