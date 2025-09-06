const ExcelJS = require('exceljs');
const db = require('../services/db');

function buildRange({ date, from, to }) {
  const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s));
  const isDateTime = (s) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(String(s));
  const norm = (s, end = false) => {
    if (isDateOnly(s)) return `${s} ${end ? '23:59:59' : '00:00:00'}`;
    if (isDateTime(s)) return s;
    return null;
  };
  if (date) {
    const start = norm(date, false);
    const end = norm(date, true);
    if (!start || !end) return null;
    return { start, end };
  }
  if (from && to) {
    const start = norm(from, false);
    const end = norm(to, true);
    if (!start || !end) return null;
    return { start, end };
  }
  return null;
}

function parseParkingIdx(req) {
  const n = parseInt((req.query && req.query.parking_idx) || '', 10);
  return Number.isFinite(n) ? n : null;
}

async function getParkingLoc(parkingIdx) {
  if (!parkingIdx) return null;
  try {
    const rows = await db.query(
      'SELECT PARKING_LOC FROM tb_parking WHERE PARKING_IDX = ?',
      [parkingIdx]
    );
    return rows.length > 0 ? rows[0].PARKING_LOC : null;
  } catch (err) {
    console.error('Error getting parking location:', err);
    return null;
  }
}

// Export statistics data as CSV
async function exportStatsCSV(req, res, next) {
  try {
    const { type = 'by-type', date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });
    const parkingIdx = parseParkingIdx(req);

    let data = [];
    let filename = 'statistics';
    
    switch (type) {
      case 'by-type':
        data = await getViolationsByTypeData(range, parkingIdx);
        filename = '위반유형별통계';
        break;
      case 'by-date':
        data = await getViolationsByDateData(range, parkingIdx, req.query.group || 'day');
        filename = '날짜별통계';
        break;
      case 'by-location':
        data = await getViolationsByLocationData(range, parkingIdx);
        filename = '위치별통계';
        break;
      case 'by-weekday':
        data = await getViolationsByWeekdayData(range, parkingIdx);
        filename = '요일별통계';
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    // Convert to CSV format
    const csvHeaders = Object.keys(data[0] || {}).join(',');
    const csvRows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const parkingLoc = await getParkingLoc(parkingIdx);
    const parkingPrefix = parkingLoc ? `${parkingLoc}_` : '';
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(parkingPrefix)}${encodeURIComponent(filename)}_${dateStr}.csv`);
    res.send('\ufeff' + csvContent); // BOM for proper Korean encoding
  } catch (err) {
    console.error('Error exporting CSV:', err.message);
    next(err);
  }
}

// Export statistics data as Excel (migrated to ExcelJS)
async function exportStatsExcel(req, res, next) {
  try {
    const { date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });
    const parkingIdx = parseParkingIdx(req);

    // Get all data types
    const byType = await getViolationsByTypeData(range, parkingIdx);
    const byDate = await getViolationsByDateData(range, parkingIdx, 'day');
    const byWeekday = await getViolationsByWeekdayData(range, parkingIdx);

    // Create workbook with ExcelJS
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Fingertips';
    wb.created = new Date();

    const addSheet = (name, rows) => {
      if (!rows || rows.length === 0) return;
      const ws = wb.addWorksheet(name);
      const headers = Object.keys(rows[0] || {});
      if (headers.length === 0) return;
      ws.columns = headers.map((h) => ({ header: h, key: h }));
      rows.forEach((r) => ws.addRow(r));
      // Header style
      ws.getRow(1).font = { bold: true };
      // Auto-fit columns with sensible bounds
      ws.columns.forEach((col) => {
        let max = String(col.header || '').length;
        col.eachCell({ includeEmpty: false }, (cell) => {
          const v = cell.value;
          const s = typeof v === 'object' && v && 'richText' in v ? v.richText.map(t=>t.text).join('') : String(v ?? '');
          max = Math.max(max, s.length);
        });
        col.width = Math.min(40, Math.max(10, max + 2));
      });
    };

    addSheet('위반유형별', byType);
    addSheet('날짜별', byDate);
    addSheet('요일별', byWeekday);

    // Generate Excel buffer
    const buffer = await wb.xlsx.writeBuffer();

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const parkingLoc = await getParkingLoc(parkingIdx);
    const parkingPrefix = parkingLoc ? `${parkingLoc}_` : '';
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(parkingPrefix)}${encodeURIComponent('위반통계')}_${dateStr}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Error exporting Excel:', err.message);
    next(err);
  }
}

// Helper functions to get data
async function getViolationsByTypeData(range, parkingIdx) {
  if (range || parkingIdx !== null) {
    const where = [];
    const params = [];
    if (range) {
      where.push('v.created_at >= ? AND v.created_at <= ?');
      params.push(range.start, range.end);
    }
    if (parkingIdx !== null) {
      where.push('d.parking_idx = ?');
      params.push(parkingIdx);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return await db.query(
      `SELECT v.violation_type AS '위반유형', COUNT(*) AS '건수'
         FROM tb_violation v
         JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
       ${whereSql}
        GROUP BY v.violation_type
        ORDER BY COUNT(*) DESC`,
      params
    );
  }
  return await db.query(`SELECT * FROM V_VIOLATIONS_BY_TYPE`);
}

async function getViolationsByDateData(range, parkingIdx, group = 'day') {
  let selectClause;
  switch (group) {
    case 'month':
      selectClause = `DATE_FORMAT(v.created_at, '%Y-%m') AS '기간', COUNT(*) AS '건수'`;
      break;
    case 'week':
      selectClause = `YEARWEEK(v.created_at, 3) AS '주차',
                      MIN(DATE_FORMAT(v.created_at, '%Y-%m-%d')) AS '시작일',
                      MAX(DATE_FORMAT(v.created_at, '%Y-%m-%d')) AS '종료일',
                      COUNT(*) AS '건수'`;
      break;
    default:
      selectClause = `DATE_FORMAT(v.created_at, '%Y-%m-%d') AS '날짜', COUNT(*) AS '건수'`;
      break;
  }

  const where = [];
  const params = [];
  if (range) {
    where.push('v.created_at >= ? AND v.created_at <= ?');
    params.push(range.start, range.end);
  }
  if (parkingIdx !== null) {
    where.push('d.parking_idx = ?');
    params.push(parkingIdx);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return await db.query(
    `SELECT ${selectClause}
       FROM tb_violation v
       JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
     ${whereSql}
      GROUP BY ${group === 'week' ? 'YEARWEEK(v.created_at, 3)' : group === 'month' ? 'DATE_FORMAT(v.created_at, \'%Y-%m\')' : 'DATE_FORMAT(v.created_at, \'%Y-%m-%d\')'}
      ORDER BY ${group === 'week' ? 'YEARWEEK(v.created_at, 3)' : group === 'month' ? 'DATE_FORMAT(v.created_at, \'%Y-%m\')' : 'DATE_FORMAT(v.created_at, \'%Y-%m-%d\')'}`,
    params
  );
}

async function getViolationsByLocationData(range, parkingIdx) {
  if (range || parkingIdx !== null) {
    const where = [];
    const params = [];
    if (range) {
      where.push('v.created_at >= ? AND v.created_at <= ?');
      params.push(range.start, range.end);
    }
    if (parkingIdx !== null) {
      where.push('d.parking_idx = ?');
      params.push(parkingIdx);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    return await db.query(
      `SELECT p.PARKING_LOC AS '위치', COUNT(*) AS '건수'
         FROM tb_violation v
         JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
         JOIN tb_parking   p ON p.PARKING_IDX = d.parking_idx
       ${whereSql}
        GROUP BY p.PARKING_LOC
        ORDER BY COUNT(*) DESC`,
      params
    );
  }
  
  return await db.query(`SELECT * FROM V_VIOLATIONS_BY_LOCATION`);
}

async function getViolationsByWeekdayData(range, parkingIdx) {
  const where = [];
  const params = [];
  if (range) {
    where.push('v.created_at >= ? AND v.created_at <= ?');
    params.push(range.start, range.end);
  }
  let join = '';
  if (parkingIdx !== null) {
    join = 'JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx';
    where.push('d.parking_idx = ?');
    params.push(parkingIdx);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  return await db.query(
    `SELECT 
       CASE MAX(DAYOFWEEK(v.created_at))
         WHEN 1 THEN '일요일'
         WHEN 2 THEN '월요일'
         WHEN 3 THEN '화요일'
         WHEN 4 THEN '수요일'
         WHEN 5 THEN '목요일'
         WHEN 6 THEN '금요일'
         WHEN 7 THEN '토요일'
       END AS '요일',
       COUNT(*) AS '건수'
     FROM tb_violation v
     ${join}
     ${whereSql}
     GROUP BY DAYOFWEEK(v.created_at)
     ORDER BY DAYOFWEEK(v.created_at)`,
    params
  );
}

module.exports = {
  exportStatsCSV,
  exportStatsExcel,
};
