const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const td = await db.query("SELECT COUNT(*) AS total_disabled FROM tb_parking_space WHERE space_type = 'disabled'");
    const cd = await db.query("SELECT COUNT(*) AS current_disabled FROM tb_parking_space WHERE space_type = 'disabled' AND is_occupied = TRUE");
    const tg = await db.query("SELECT COUNT(*) AS total_general FROM tb_parking_space WHERE space_type = 'general'");
    const cg = await db.query("SELECT COUNT(*) AS current_general FROM tb_parking_space WHERE space_type = 'general' AND is_occupied = TRUE");
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
    const rows = await db.query(
      'SELECT space_id, space_type, is_occupied, ve_number FROM tb_parking_space ORDER BY space_id'
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
        ORDER BY v.created_at DESC
        LIMIT 5`
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
    const rows = await db.query(
      `SELECT log_idx, ve_number, space_id, entry_at, exit_at
         FROM tb_parking_log
        ORDER BY entry_at DESC
        LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in /dashboard/parking-logs', err);
    next(err);
  }
});

module.exports = router;
