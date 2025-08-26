import React from 'react'
import '../style/mainpage.css'
import logo from '../assets/logo.png'
const Logo = () => {
  return (
    <div>
        <div className='Mainpage_logo'>
                    <div className="logo-container">
                        <img src={logo} alt="로고" style={{ width: '50px', height: "50px", marginRight: '0px' }} />
                        <span style={{fontSize:"30px",fontWeight:"bold",fontFamily:"Pretendard Variable"}}>
                            이음주차
                        </span>
                    </div>
                </div>
    </div>
  )
}

export default Logo