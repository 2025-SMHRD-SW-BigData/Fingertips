import React, { useEffect, useMemo, useState } from 'react';
import { getParkingsByDistrict } from '../services/api';
import pcodeTxt from '../../pcode.txt?raw';

const parseDistricts = (raw) => {
  try {
    const lines = String(raw || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && s.includes('='));
    const out = [];
    for (const line of lines) {
      const [nameRaw, codeRaw] = line.split('=');
      const name = String(nameRaw || '').trim().replace(/^['"]|['"]$/g, '');
      const codeStr = String(codeRaw || '').trim().replace(/^['"]|['"]$/g, '');
      if (!name || !codeStr) continue;
      const codeNum = parseInt(codeStr, 10);
      const value = Number.isFinite(codeNum) ? String(codeNum) : codeStr;
      out.push({ label: name, value });
    }
    // Deduplicate by value
    const seen = new Set();
    const uniq = [];
    for (const it of out) {
      if (seen.has(it.value)) continue;
      seen.add(it.value);
      uniq.push(it);
    }
    return uniq;
  } catch (_) {
    return [];
  }
};

const ParkingControls = () => {
  const districts = useMemo(() => parseDistricts(pcodeTxt), []);
  const [district, setDistrict] = useState(() => localStorage.getItem('district_code') || '');
  const [districtName, setDistrictName] = useState(() => localStorage.getItem('district_name') || '');
  const [parkings, setParkings] = useState([]);
  const [selectedParking, setSelectedParking] = useState(() => localStorage.getItem('parking_idx') || '');
  const [emptyMsg, setEmptyMsg] = useState('');

  useEffect(() => {
    // Initialize districtName from list if missing
    if (district && !districtName) {
      const found = districts.find((d) => d.value === district);
      if (found) setDistrictName(found.label);
    }
  }, [district, districtName, districts]);

  useEffect(() => {
    let cancelled = false;
    if (!district) {
      setParkings([]);
      setEmptyMsg('');
      return () => { cancelled = true; };
    }
    const found = districts.find((d) => d.value === district);
    const name = found?.label || districtName || '';
    setDistrictName(name);
    // Special-case: 광산구/Gwangsan-gu → show single option message (do not disable)
    const lname = (name || '').toLowerCase();
    if (lname.includes('광산') || lname.includes('gwangsan')) {
      setParkings([]);
      setEmptyMsg('소속된 주차장이 없습니다.');
      return () => { cancelled = true; };
    }
    setEmptyMsg('');
    getParkingsByDistrict(district)
      .then((rows) => {
        if (cancelled) return;
        setParkings(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setParkings([]);
      });
    return () => { cancelled = true; };
  }, [district, districtName, districts]);

  const onDistrictChange = (e) => {
    const val = e.target.value;
    setDistrict(val);
    const found = districts.find((d) => d.value === val);
    const name = found?.label || '';
    setDistrictName(name);
    try {
      if (val) {
        localStorage.setItem('district_code', String(val));
        localStorage.setItem('district_name', name);
      } else {
        localStorage.removeItem('district_code');
        localStorage.removeItem('district_name');
      }
    } catch (_) {}
    // reset parking on district change
    // Keep existing parking_idx so other pages do not revert to ALL immediately.
    // Only clear UI selection; dispatch occurs on explicit parking change.
    setSelectedParking('');
    // Notify listeners that district changed so components can re-render (e.g., show '-') without refetching ALL.
    try { window.dispatchEvent(new CustomEvent('district-change', { detail: { code: val, name } })); } catch (_) {}
  };

  const onParkingChange = (e) => {
    const val = e.target.value;
    setSelectedParking(val);
    try {
      if (val) localStorage.setItem('parking_idx', String(val));
      else localStorage.removeItem('parking_idx');
    } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('parking-change', { detail: val })); } catch (_) {}
  };

  return (
    <div className="parking-controls">
      <div className="parking-controls-inner">
        <select aria-label="행정구 선택" value={district} onChange={onDistrictChange}>
          <option value="">행정구 선택</option>
          {districts.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <select aria-label="주차장 선택" value={selectedParking} onChange={onParkingChange} disabled={!district}>
          {emptyMsg ? (
            <option value="">{emptyMsg}</option>
          ) : (
            <>
              <option value="">주차장 선택</option>
              {parkings.map((p) => (
                <option key={p.parking_idx} value={p.parking_idx}>{p.parking_loc || `Parking ${p.parking_idx}`}</option>
              ))}
            </>
          )}
        </select>
      </div>
    </div>
  );
};

export default ParkingControls;
