const express = require('express');
const db = require('../services/db');

const router = express.Router();

// Helpers for pagination
function toInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// GET /api/violations
// Query: page, limit, search, date (YYYY-MM-DD), parking_idx
router.get('/', async (req, res, next) => {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const date = (req.query.date || '').trim();
    const parkingIdx = parseInt(req.query.parking_idx, 10);

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
    if (Number.isFinite(parkingIdx)) {
      where.push('d.parking_idx = ?');
      params.push(parkingIdx);
    }
    const status = (req.query.status || '').toString().trim().toLowerCase();
    if (status === 'pending' || status === 'unprocessed') {
      where.push("(v.admin_status IS NULL OR v.admin_status = '')");
    } else if (status === 'processed') {
      where.push("(v.admin_status IS NOT NULL AND v.admin_status <> '')");
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

    const data = await db.query(
      `SELECT v.violation_idx,
              v.violation_type,
              v.created_at AS violation_date,
              v.admin_status,
              v.admin_confirmed_at,
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
        totalPages: Math.max(1, Math.ceil((totalItems || 0) / limit)),
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
              v.admin_status,
              v.admin_confirmed_at,
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

// PATCH /api/violations/:id
// Allowed fields: violation_type, admin_status, admin_confirmed_at, admin_confirmed_by, admin_content
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: '잘못된 ID 형식입니다' });
    }

    const allowedUpdates = [
      'violation_type', 
      'admin_status', 
      'admin_confirmed_at', 
      'admin_confirmed_by'
    ];
    const updates = {};
    const body = req.body;

    for (const key in body) {
      if (allowedUpdates.includes(key)) {
        let value = body[key];
        
        // 변경점 2: 'admin_confirmed_at' 필드인 경우, DB 포맷으로 변환
        if (key === 'admin_confirmed_at' && value) {
          // 'YYYY-MM-DDTHH:mm:ss.sssZ' -> 'YYYY-MM-DD HH:mm:ss'
          value = value.slice(0, 19).replace('T', ' ');
        }
        
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: '업데이트할 유효한 필드가 없습니다.' });
    }

    const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const params = [...Object.values(updates), id];

    const sql = `UPDATE tb_violation SET ${setClauses} WHERE violation_idx = ?`;
    
    const result = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '해당 위반 내역을 찾을 수 없습니다.' });
    }

    res.json({ message: '위반 내역이 성공적으로 업데이트되었습니다.', updatedId: id });

  } catch (err) {
    console.error(`Error in PATCH /api/violations/${req.params.id}`, err);
    next(err);
  }
});
// PATCH /api/violations/:id/alerts/read
// Marks related alerts as read for a given admin_id
router.patch('/:id/alerts/read', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: '잘못된 ID' });
    const adminId = (req.body?.admin_id || '').toString().trim();
    if (!adminId) return res.status(400).json({ message: 'admin_id가 필요합니다.' });

    await db.query(
      `UPDATE tb_alert SET read_at = NOW()
         WHERE violation_idx = ? AND admin_id = ? AND read_at IS NULL`,
      [id, adminId]
    );
    res.json({ message: '관련 알림을 읽음 처리했습니다.' });
  } catch (err) {
    console.error('Error in PATCH /api/violations/:id/alerts/read', err);
    next(err);
  }
});

// POST /api/violations/:id/broadcast
// Records a broadcast intent; integration can be added later
router.post('/:id/broadcast', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: '잘못된 ID' });
    const adminId = (req.body?.admin_id || '').toString().trim() || null;
    const message = (req.body?.message || '').toString().trim() || '계도방송 요청';
    const note = (req.body?.note || '').toString().trim() || null;

    await db.query(
      `INSERT INTO tb_alert (violation_idx, alert_type, alert_msg, sent_at, is_success, admin_id, admin_status, admin_content, processed_at)
       VALUES (?, 'broadcast', ?, NOW(), ?, ?, '계도방송', ?, NOW())`,
      [id, message, 1, adminId, note]
    );
    res.json({ message: '계도방송을 기록했습니다.' });
  } catch (err) {
    console.error('Error in POST /api/violations/:id/broadcast', err);
    next(err);
  }
});

module.exports = router;
