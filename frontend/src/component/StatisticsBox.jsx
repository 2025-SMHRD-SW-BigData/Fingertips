import React from 'react'
import '../style/mainpage.css'
import disabled from "../assets/disabled.png"
import parking from "../assets/parking.png"
import notcar from "../assets/notcar.png"
const StatisticsBox = () => {
  return (
    <div className="stats-container">
      <div className='stat-box'>
        <img src={disabled} alt="" style={{
          width: "100px",
          height: "100px",
          marginLeft: "50px",
          filter: 'brightness(0) invert(1)'
        }} />
        <div className="stat-box-green">
          <div style={{
            fontSize: "30px",
            fontFamily: "Pretendard Variable"
           }}>장애인차량</div>
          <div style={{
             padding: "0px", 
             fontSize: "40px",
             color: "green", 
             fontWeight:"900"}}> 1 
            <span style={{ color: "white", fontSize: "20px",fontWeight:"100" }}>/ 3</span>
            </div>
        </div>
      </div>
      <div className='stat-box'>
        <img src={parking} alt="" style={{
          width: "100px",
          height: "100px",
          marginLeft: "50px",
          filter: 'brightness(0) invert(1)'
        }} />
        <div className="stat-box-blue">
          <div style={{
            fontSize: "30px",
            fontFamily: "Pretendard Variable"
          }}>일반차량</div>
          <div style={{
             padding: "0px", 
             fontSize: "40px", 
             color: "blue",
             fontWeight: "900" }}>30
            <span style={{ color: "white", fontSize: "20px",fontWeight:"100" }}>/ 50</span>
          </div>
        </div>
      </div>
      <div className='stat-box'>
        <img src={notcar} alt="" style={{
          width: "100px",
          height: "100px",
          marginLeft: "50px",
          filter: 'brightness(0) invert(1)'
        }} />
        <div className="stat-box-red">
          <div style={{
            fontSize: "30px",
            fontFamily: "Pretendard Variable"
          }}>위반차량</div>
          <div style={{ padding: "0px", fontSize: "40px", color: "red",fontWeight:"900" }}>7</div>
        </div>
      </div>
    </div >


  )
}

export default StatisticsBox