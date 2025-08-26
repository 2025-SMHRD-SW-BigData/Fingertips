import React from 'react'
import logo from '../assets/logo.png'
import '../style/mainpage.css'

const MainpageTop = () => {
    return (
        <div className='Top_box' >  
                <input
                    type="text"
                    placeholder="차량번호 / 구역 / 카메라 이름 검색"
                    className="serch"
                />
            
        </div>
    )
}

export default MainpageTop