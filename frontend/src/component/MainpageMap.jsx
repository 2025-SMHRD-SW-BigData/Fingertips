import React from 'react'
import map from '../assets/map.png'
import "../style/mainpage.css"

const MainpageMap = () => {
  return (
    <div className='mainmap'>
        <img src={map} alt="" style={{width:"1250px"}} />
    </div>
  )
}

export default MainpageMap