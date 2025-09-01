import React from 'react'
import '../style/mainpage.css'
import Sidebar from './Sidebar'
import MainpageTop from './MainpageTop'
import StatisticsBox from './StatisticsBox'
import Logo from './Logo'
import MainpageMap from './MainpageMap'
import Mainpage_vio from './Mainpage_vio'
import Main_inout from './Main_inout'

const Mainpage = () => {
  return (
    <div className="Mainpage_box">
      <div className="page-layout">
        <Logo></Logo>
        <MainpageTop />
        <Sidebar />

          <StatisticsBox />
          <MainpageMap></MainpageMap>
          <div className="bottom-content">
            <Mainpage_vio />
            <Main_inout />
          </div>
      </div>
    </div>
  )
}

export default Mainpage
