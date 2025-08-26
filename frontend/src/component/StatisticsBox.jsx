import React from 'react'
import '../style/mainpage.css'
const StatisticsBox = () => {
  return (
    <div className="stats-container">
  <div className="stat-box blue">
    <div>장애인차량</div>
    <div>1 / 3</div>
  </div>
  <div className="stat-box gray">
    <div>일반차량</div>
    <div>30 / 50</div>
  </div>
  <div className="stat-box red">
    <div>위반차량</div>
    <div>7</div>
  </div>
</div>


  )
}

export default StatisticsBox