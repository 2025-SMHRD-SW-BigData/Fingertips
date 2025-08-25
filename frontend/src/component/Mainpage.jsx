import React from 'react'
import '../style/mainpage.css'
import Sidebar from './Sidebar'
import MainpageTop from './MainpageTop'
import StatisticsBox from './StatisticsBox'

const Mainpage = () => {
  return (
    <div className="Mainpage_box">
      <div className="page-layout">
        <MainpageTop />
        <Sidebar />
        <div className="main-content">
          <StatisticsBox />
        </div>
      </div>
    </div>
  )
}

export default Mainpage
