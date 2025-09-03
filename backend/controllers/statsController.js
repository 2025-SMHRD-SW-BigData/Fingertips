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
    if (!start || !end) return null; // let caller decide how to respond
    return { start, end };
  }
  if (from && to) {
    const start = norm(from, false);
    const end = norm(to, true);
    if (!start || !end) return null; // let caller decide how to respond
    return { start, end };
  }
  return null;
}

function parseParkingIdx(req) {
  const n = parseInt((req.query && req.query.parking_idx) || '', 10);
  return Number.isFinite(n) ? n : null;
}

// Stats: by violation type
async function getViolationsByType(req, res, next) {
  try {
    const { date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });
    if ((date || from || to) && !range) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid date/from/to format. Use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss',
          params: { date, from, to },
        },
      });
    }
    const parkingIdx = parseParkingIdx(req);

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
      const rows = await db.query(
        `SELECT v.violation_type AS violation_type, COUNT(*) AS cnt
           FROM tb_violation v
           JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
         ${whereSql}
          GROUP BY v.violation_type
          ORDER BY cnt DESC`,
        params
      );
      return res.json(rows);
    }

    // fallback to view (overall period)
    const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_TYPE`);
    res.json(rows);
  } catch (err) {
    console.error(`Error while getting violation stats by type`, err.message);
    next(err);
  }
}

// Stats: by date (supports group=day|week|month)
async function getViolationsByDate(req, res, next) {
  try {
    const { from, to, date } = req.query || {};
    const group = String((req.query && req.query.group) || 'day').toLowerCase();
    const range = buildRange({ date, from, to });
    if ((date || from || to) && !range) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid date/from/to format. Use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss',
          params: { date, from, to },
        },
      });
    }
    const parkingIdx = parseParkingIdx(req);

   

    // 1. SELECT 절 동적 구성
    let selectClause;
    switch (group) {
      case 'month':
        selectClause = `DATE_FORMAT(v.created_at, '%Y-%m') AS bucket, COUNT(*) AS cnt`;
        break;
      case 'week':
        selectClause = `YEARWEEK(v.created_at, 3) AS bucket,
                        MIN(DATE_FORMAT(v.created_at, '%Y-%m-%d')) AS start,
                        MAX(DATE_FORMAT(v.created_at, '%Y-%m-%d')) AS end,
                        COUNT(*) AS cnt`;
        break;
      default: // 'day'
        selectClause = `DATE_FORMAT(v.created_at, '%Y-%m-%d') AS bucket, COUNT(*) AS cnt`;
        break;
    }

    // 2. WHERE 절 동적 구성
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

    // 3. 최종 쿼리 조립 및 실행
    const sql = `
      SELECT ${selectClause}
        FROM tb_violation v
        JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
      ${whereSql}
       GROUP BY bucket
       ORDER BY bucket
    `;

    const rows = await db.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error(`Error while getting violation stats by date`, err.message);
    next(err);
  }
}

// Stats: by location
async function getViolationsByLocation(req, res, next) {
  try {
    const { date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });
    if ((date || from || to) && !range) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid date/from/to format. Use YYYY-MM-DD or YYYY-MM-DD HH:mm:ss',
          params: { date, from, to },
        },
      });
    }
    const parkingIdx = parseParkingIdx(req);

    if (range) {
      const params = [range.start, range.end];
      const extra = parkingIdx !== null ? ' AND d.parking_idx = ?' : '';
      if (parkingIdx !== null) params.push(parkingIdx);
      const rows = await db.query(
        `SELECT p.PARKING_LOC AS location, COUNT(*) AS cnt
           FROM tb_violation v
           JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
           JOIN tb_parking   p ON p.PARKING_IDX = d.parking_idx
          WHERE v.created_at >= ? AND v.created_at <= ?${extra}
          GROUP BY p.PARKING_LOC
          ORDER BY cnt DESC`,
        params
      );
      return res.json(rows);
    }

    if (parkingIdx !== null) {
      const rows = await db.query(
        `SELECT p.PARKING_LOC AS location, COUNT(*) AS cnt
           FROM tb_violation v
           JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
           JOIN tb_parking   p ON p.PARKING_IDX = d.parking_idx
          WHERE d.parking_idx = ?
          GROUP BY p.PARKING_LOC
          ORDER BY cnt DESC`,
        [parkingIdx]
      );
      return res.json(rows);
    }

    const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_LOCATION`);
    res.json(rows);
  } catch (err) {
    console.error(`Error while getting violation stats by location`, err.message);
    next(err);
  }
}

// Stats: hourly (same-day)
async function getViolationsByHour(req, res, next) {
  try {
    const { date } = req.query || {};
    if (!date) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'date is required (YYYY-MM-DD)' } });
    }
    const start = `${date} 00:00:00`;
    const end = `${date} 23:59:59`;
    const parkingIdx = parseParkingIdx(req);
    const where = ['v.created_at >= ? AND v.created_at <= ?'];
    const params = [start, end];
    let join = '';
    if (parkingIdx !== null) {
      join = 'JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx';
      where.push('d.parking_idx = ?');
      params.push(parkingIdx);
    }
    const rows = await db.query(
      `SELECT HOUR(v.created_at) AS hour, COUNT(*) AS cnt
         FROM tb_violation v
         ${join}
        WHERE ${where.join(' AND ')}
        GROUP BY hour
        ORDER BY hour`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(`Error while getting violation stats by hour`, err.message);
    next(err);
  }
}

module.exports = {
  getViolationsByType,
  getViolationsByDate,
  getViolationsByLocation,
  getViolationsByHour,
};
