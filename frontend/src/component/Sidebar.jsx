import React from 'react'
import '../style/mainpage.css'
import Xcarbell from '../assets/Xcarbell.png'
import checklist from '../assets/checklist.png'
import vidio from '../assets/vidio.png'
import graf from '../assets/graf.png'
import mypage from '../assets/mypage.png'
import setting from '../assets/setting.png'



const Sidebar = () => {
  return (
    <div className='Sidebar_box'>
        <div className="side_sbox" >
          <img src={Xcarbell} alt="" 
          style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }}
          />
          <span style={{marginLeft:"10px"}}>위반차량</span>
          <span style={{display:"inline-block",
            backgroundColor:"#2B3341", 
            width:"50px",
            height:"20px", 
            marginLeft:"30px",
            borderRadius:"10px",
            textAlign:"center",
            fontFamily:"Pretendard Variable"}}> 7</span>
          </div>
        <div className='side_sbox'>
          <img src={checklist} alt=""
          style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }} />
          <span style={{marginLeft:"10px"}}>알림 내역</span>
          <span style={{display:"inline-block",
            backgroundColor:"#2B3341", 
            width:"50px",
            height:"20px", 
            marginLeft:"30px",
            borderRadius:"10px",
            textAlign:"center",
            fontFamily:"Pretendard Variable"}}> 7</span>
          </div>
        <div className='side_sbox'>
          <img src={vidio} alt=""
           style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }}
           />
          <span style={{marginLeft:"10px"}}>영상 정보</span>
          </div>
        <div className='side_sbox'>
          <img src={graf} alt="" 
          style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }}
          />
          <span style={{marginLeft:"10px"}}>통계 분석</span>
          </div>
        <div className='side_sbox'>
          <img src={mypage} alt="" 
          style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }}
          />
          <span style={{marginLeft:"10px"}}>마이 페이지</span>
          </div>
        <div className='side_sbox'>
          <img src={setting} alt="" 
           style={{
            width:"20px",
            filter: 'brightness(0) invert(1)'
          }}
          />
         <span style={{marginLeft:"10px"}}>설정</span>
          </div>
     </div>
  )
}

export default Sidebar