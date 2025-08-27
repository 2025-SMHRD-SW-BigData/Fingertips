const express = require('express');
const db = require('../services/db');

const router = express.Router();

// Helpers for pagination
function toInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// GET /api/violations
// Query: page, limit, search, date (YYYY-MM-DD)
router.get('/', async (req, res, next) => {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const date = (req.query.date || '').trim();

    const where = [];
    const params = [];

    if (search) {
      where.push('(d.ve_number LIKE ? OR p.PARKING_LOC LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (date) {
      where.push('DATE(v.created_at) = ?');
      params.push(date);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRows = await db.query(
      `SELECT COUNT(*) AS cnt
         FROM tb_violation v
         JOIN tb_detection d ON v.ve_detection_idx = d.ve_detection_idx
         JOIN tb_parking p   ON d.parking_idx = p.PARKING_IDX
         JOIN tb_camera c    ON d.camera_idx = c.camera_idx
       ${whereSql}`,
      params
    );
    const totalItems = countRows[0]?.cnt || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const data = await db.query(
      `SELECT v.violation_idx,
              v.violation_type,
              v.created_at AS violation_date,
              d.ve_number,
              p.PARKING_LOC AS parking_loc,
              c.camera_loc
         FROM tb_violation v
         JOIN tb_detection d ON v.ve_detection_idx = d.ve_detection_idx
         JOIN tb_parking p   ON d.parking_idx = p.PARKING_IDX
         JOIN tb_camera c    ON d.camera_idx = c.camera_idx
       ${whereSql}
        ORDER BY v.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/violations', err);
    next(err);
  }
});

// GET /api/violations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: '잘못된 ID' });

    const rows = await db.query(
      `SELECT v.violation_idx,
              v.violation_type,
              v.created_at AS violation_date,
              d.ve_number,
              p.PARKING_LOC AS parking_loc,
              c.camera_loc,
              s.FILE_SRC AS video_url
         FROM tb_violation v
         JOIN tb_detection d ON v.ve_detection_idx = d.ve_detection_idx
         JOIN tb_parking p   ON d.parking_idx = p.PARKING_IDX
         JOIN tb_camera c    ON d.camera_idx = c.camera_idx
         JOIN tb_storage s   ON d.file_idx = s.FILE_IDX
        WHERE v.violation_idx = ?
        LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: '해당 위반 내역을 찾을 수 없습니다.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error in GET /api/violations/:id', err);
    next(err);
  }
});

module.exports = router;

