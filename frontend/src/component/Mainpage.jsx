import React from 'react'
import '../style/mainpage.css'

const Mainpage = () => {
  return (
    <div className="Mainpage_box">
      
      <div className="Mainpage_whitebox" >
        <div style={{
        width: '200px',
        height:'1010px',
        backgroundColor: '#1F2433',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        left:"0",
        top:"0",
        position:"absolute",
        borderRadius:"50px"
      }}>
        <h2>스마트 주차 관리</h2>
        <div style={{ backgroundColor: '#3A3F55', padding: '10px', borderRadius: '10px' }}>대시보드</div>
        <div style={{ backgroundColor: '#3A3F55', padding: '10px', borderRadius: '10px' }}>알림 내역</div>
        <div style={{ backgroundColor: '#3A3F55', padding: '10px', borderRadius: '10px' }}>실시간 모니터링</div>
        <div style={{ backgroundColor: '#3A3F55', padding: '10px', borderRadius: '10px' }}>통계 분석</div>
        <div style={{ backgroundColor: '#3A3F55', padding: '10px', borderRadius: '10px' }}>설정</div>
      </div>
      </div>
    </div>
  )
}

export default Mainpage
