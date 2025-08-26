import React from 'react'
import logo from '../assets/logo.png'
import '../style/mainpage.css'
import search from '../assets/search.png'
import bell from '../assets/bell.png'

const MainpageTop = () => {
    return (
        <div className='Top_box' >  
        <img src={search} alt="검색" style={{
            width:"20px"
        }
        } className='search-icon' />
                <input
                    type="text"
                    placeholder="차량번호 / 구역 / 카메라 이름 검색"
                    className="serch"
                
                />
                <div className='today'>
                    2025-08-26
                </div>
                <div className='manager'>
                    관리자:핑거팁스
                </div>
                <div className='Noti'>
                    <img src={bell} alt="" style={{width:"20px"}} />
                </div>
                <div className='login_out'>
                    로그아웃
                </div>
            
        </div>
    )
}

export default MainpageTop
