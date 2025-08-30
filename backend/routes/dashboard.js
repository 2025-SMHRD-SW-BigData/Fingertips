const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasFilter = Number.isFinite(parkingIdx);

    const td = await db.query(
      `SELECT COUNT(*) AS total_disabled FROM tb_parking_space WHERE space_type = 'disabled'${hasFilter ? ' AND parking_idx = ?' : ''}`,
      hasFilter ? [parkingIdx] : []
    );
    const cd = await db.query(
      `SELECT COUNT(*) AS current_disabled FROM tb_parking_space WHERE space_type = 'disabled' AND is_occupied = TRUE${hasFilter ? ' AND parking_idx = ?' : ''}`,
      hasFilter ? [parkingIdx] : []
    );
    const tg = await db.query(
      `SELECT COUNT(*) AS total_general FROM tb_parking_space WHERE space_type = 'general'${hasFilter ? ' AND parking_idx = ?' : ''}`,
      hasFilter ? [parkingIdx] : []
    );
    const cg = await db.query(
      `SELECT COUNT(*) AS current_general FROM tb_parking_space WHERE space_type = 'general' AND is_occupied = TRUE${hasFilter ? ' AND parking_idx = ?' : ''}`,
      hasFilter ? [parkingIdx] : []
    );
    const tv = await db.query('SELECT COUNT(*) AS today_violations FROM tb_violation WHERE DATE(created_at) = CURDATE()');

    const total_disabled = td[0]?.total_disabled || 0;
    const current_disabled = cd[0]?.current_disabled || 0;
    const total_general = tg[0]?.total_general || 0;
    const current_general = cg[0]?.current_general || 0;
    const today_violations = tv[0]?.today_violations || 0;

    res.json({
      disabledParking: { current: Number(current_disabled), total: Number(total_disabled) },
      generalParking: { current: Number(current_general), total: Number(total_general) },
      todayViolations: Number(today_violations),
    });
  } catch (err) {
    console.error('Error in /dashboard/summary', err);
    next(err);
  }
});

// GET /api/dashboard/parking-status
router.get('/parking-status', async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasFilter = Number.isFinite(parkingIdx);
    const rows = await db.query(
      `SELECT space_id, space_type, is_occupied, ve_number
         FROM tb_parking_space
        ${hasFilter ? 'WHERE parking_idx = ?' : ''}
        ORDER BY space_id`,
      hasFilter ? [parkingIdx] : []
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in /dashboard/parking-status', err);
    next(err);
  }
});

// GET /api/dashboard/recent-violations (latest 5)
router.get('/recent-violations', async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasFilter = Number.isFinite(parkingIdx);
    const rows = await db.query(
      `SELECT v.violation_idx,
              d.ve_number,
              p.PARKING_LOC AS parking_loc,
              v.violation_type,
              v.created_at AS violation_date,
              a.admin_status
         FROM tb_violation v
         JOIN tb_detection d ON v.ve_detection_idx = d.ve_detection_idx
         JOIN tb_parking p   ON d.parking_idx = p.PARKING_IDX
    LEFT JOIN tb_alert a     ON a.violation_idx = v.violation_idx
                            AND a.sent_at = (
                                SELECT MAX(a2.sent_at) FROM tb_alert a2 WHERE a2.violation_idx = v.violation_idx
                            )
        ${hasFilter ? 'WHERE d.parking_idx = ?' : ''}
        ORDER BY v.created_at DESC
        LIMIT 5`,
      hasFilter ? [parkingIdx] : []
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in /dashboard/recent-violations', err);
    next(err);
  }
});

// GET /api/dashboard/parking-logs (latest 5)
router.get('/parking-logs', async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasFilter = Number.isFinite(parkingIdx);
    const rows = await db.query(
      hasFilter
        ? `SELECT pl.log_idx, pl.ve_number, pl.space_id, pl.entry_at, pl.exit_at
             FROM tb_parking_log pl
             JOIN tb_parking_space ps ON ps.space_id = pl.space_id
            WHERE ps.parking_idx = ?
            ORDER BY pl.entry_at DESC
            LIMIT 5`
        : `SELECT log_idx, ve_number, space_id, entry_at, exit_at
             FROM tb_parking_log
            ORDER BY entry_at DESC
            LIMIT 5`,
      hasFilter ? [parkingIdx] : []
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in /dashboard/parking-logs', err);
    next(err);
  }
});

// GET /api/dashboard/summary-by-parking
router.get('/summary-by-parking', async (req, res, next) => {
  try {
    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasFilter = Number.isFinite(parkingIdx);
    const rows = await db.query(
      `SELECT p.PARKING_IDX AS parking_idx,
              p.PARKING_LOC AS parking_loc,
              SUM(CASE WHEN s.space_type = 'general'  THEN 1 ELSE 0 END) AS total_general,
              SUM(CASE WHEN s.space_type = 'general'  AND s.is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied_general,
              SUM(CASE WHEN s.space_type = 'disabled' THEN 1 ELSE 0 END) AS total_disabled,
              SUM(CASE WHEN s.space_type = 'disabled' AND s.is_occupied = TRUE THEN 1 ELSE 0 END) AS occupied_disabled
         FROM tb_parking p
         LEFT JOIN tb_parking_space s ON s.parking_idx = p.PARKING_IDX
        ${hasFilter ? 'WHERE p.PARKING_IDX = ?' : ''}
        GROUP BY p.PARKING_IDX, p.PARKING_LOC
        ORDER BY p.PARKING_IDX`,
      hasFilter ? [parkingIdx] : []
    );

    const mapped = rows.map((r) => {
      const tg = Number(r.total_general || 0);
      const og = Number(r.occupied_general || 0);
      const td = Number(r.total_disabled || 0);
      const od = Number(r.occupied_disabled || 0);
      const atg = Math.max(0, tg - og);
      const atd = Math.max(0, td - od);
      const ot = og + od;
      const tt = tg + td;
      return {
        parking_idx: Number(r.parking_idx),
        parking_loc: r.parking_loc,
        total_general: tg,
        occupied_general: og,
        total_disabled: td,
        occupied_disabled: od,
        available_general: atg,
        available_disabled: atd,
        occupied_total: ot,
        available_total: atg + atd,
        utilization: tt ? ot / tt : 0,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error('Error in /dashboard/summary-by-parking', err);
    next(err);
  }
});

module.exports = router;
 
