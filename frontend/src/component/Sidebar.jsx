import React from 'react'
import '../style/mainpage.css'
const Sidebar = () => {
  return (
    <div className='Sidebar_box'>
        
       
        <div style={{ backgroundColor: '#3A4460', padding: '10px', borderRadius: '10px' }}>위반차량</div>
        <div style={{ backgroundColor: '#3A4460', padding: '10px', borderRadius: '10px' }}>알림 내역</div>
        <div style={{ backgroundColor: '#3A4460', padding: '10px', borderRadius: '10px' }}>영상 정보</div>
        <div style={{ backgroundColor: '#3A4460', padding: '10px', borderRadius: '10px' }}>통계 분석</div>
        <div style={{ backgroundColor: '#3A4460', padding: '10px', borderRadius: '10px' }}>설정</div>
     </div>
  )
}

export default Sidebar