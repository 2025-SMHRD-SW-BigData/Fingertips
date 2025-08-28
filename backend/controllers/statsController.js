const db = require('../services/db');

function buildRange({ date, from, to }) {
  if (date) {
    const start = `${date} 00:00:00`;
    const end = `${date} 23:59:59`;
    return { start, end };
  }
  if (from && to) return { start: from, end: to };
  return null;
}

// 유형별 통계
async function getViolationsByType(req, res, next) {
  try {
    const { date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });

    if (range) {
      const rows = await db.query(
        `SELECT v.violation_type AS violation_type, COUNT(*) AS cnt
         FROM tb_violation v
         WHERE v.created_at >= ? AND v.created_at <= ?
         GROUP BY v.violation_type
         ORDER BY cnt DESC`,
        [range.start, range.end]
      );
      return res.json(rows);
    }

    // fallback to view (전체 기간)
    const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_TYPE`);
    res.json(rows);
  } catch (err) {
    console.error(`Error while getting violation stats by type`, err.message);
    next(err);
  }
}

// 날짜별 통계 (일 기준)
async function getViolationsByDate(req, res, next) {
  try {
    // 현재는 전체 날짜 시계열을 뷰로 반환
    const rows = await db.query(`SELECT * FROM V_VIOLATIONS_BY_DATE`);
    res.json(rows);
  } catch (err) {
    console.error(`Error while getting violation stats by date`, err.message);
    next(err);
  }
}

// 장소별 통계
async function getViolationsByLocation(req, res, next) {
  try {
    const { date, from, to } = req.query || {};
    const range = buildRange({ date, from, to });

    if (range) {
      const rows = await db.query(
        `SELECT p.PARKING_LOC AS location, COUNT(*) AS cnt
         FROM tb_violation v
         JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
         JOIN tb_parking   p ON p.PARKING_IDX = d.parking_idx
         WHERE v.created_at >= ? AND v.created_at <= ?
         GROUP BY p.PARKING_LOC
         ORDER BY cnt DESC`,
        [range.start, range.end]
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

// 선택한 일자의 시간별 통계 (00-23)
async function getViolationsByHour(req, res, next) {
  try {
    const { date } = req.query || {};
    if (!date) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'date is required (YYYY-MM-DD)' } });
    }
    const start = `${date} 00:00:00`;
    const end = `${date} 23:59:59`;
    const rows = await db.query(
      `SELECT HOUR(v.created_at) AS hour, COUNT(*) AS cnt
       FROM tb_violation v
       WHERE v.created_at >= ? AND v.created_at <= ?
       GROUP BY hour
       ORDER BY hour`,
      [start, end]
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

