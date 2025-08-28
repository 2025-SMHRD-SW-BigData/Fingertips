import React, { useEffect, useMemo, useState } from 'react';
import map from '../assets/map.png';
import "../style/mainpage.css";
import { getParkingStatus } from '../services/api';

const MainpageMap = () => {
  const [spaces, setSpaces] = useState([]);

  useEffect(() => {
    let mounted = true;
    getParkingStatus()
      .then((rows) => {
        if (mounted) setSpaces(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => console.error('Failed to load parking status', err));
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const total = spaces.length;
    const occupied = spaces.filter((s) => !!s.is_occupied).length;
    return { total, occupied };
  }, [spaces]);

  return (
    <div className='mainmap'>
      <img src={map} alt="주차장 지도" style={{width:"1250px"}} />
    </div>
  );
}

export default MainpageMap;

