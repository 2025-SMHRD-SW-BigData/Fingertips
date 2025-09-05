import React from 'react';
import '../style/map.css';
import '../style/dashboard.css';
import MainpageMap from './MainpageMap';

// MapWidget: container for a large map canvas with a smaller inset that embeds MainpageMap
// No new map API is implemented; the canvas is a placeholder div with class `map-canvas`.
export default function MapWidget({ parkingIdx }) {
  return (
    <div>
      <MainpageMap parking_idx={parkingIdx} maxWidth="100%" />
    </div>
  );
}
