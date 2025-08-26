import React from 'react'
import '../style/mainpage.css'
import Sidebar from './Sidebar'
import MainpageTop from './MainpageTop'
import StatisticsBox from './StatisticsBox'
import Logo from './Logo'

const Mainpage = () => {
  return (
    <div className="Mainpage_box">
      <div className="page-layout">
        <Logo></Logo>
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
