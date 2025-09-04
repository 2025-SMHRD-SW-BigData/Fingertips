const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/alerts?status=unread|all (default: all)&parking_idx=<number>
router.get('/', async (req, res, next) => {
  try {
    const adminId = (req.query.admin_id || '').toString().trim();
    if (!adminId) return res.status(400).json({ message: 'admin_id가 ?�요?�니??' });

    const status = (req.query.status || 'all').toString();
    const parkingIdx = parseInt(req.query.parking_idx, 10);

    const baseWhere = ['a.admin_id = ?'];
    const params = [adminId];
    if (status === 'unread') {
      baseWhere.push('a.read_at IS NULL');
    }

    let rows;
    if (Number.isFinite(parkingIdx)) {
      rows = await db.query(
        `SELECT a.alert_idx, a.violation_idx, a.alert_type, a.alert_msg, a.sent_at,
                a.is_success, a.admin_id, a.read_at, a.admin_status, a.admin_content, a.processed_at
           FROM tb_alert a
           JOIN tb_violation v ON v.violation_idx = a.violation_idx
           JOIN tb_detection d ON d.ve_detection_idx = v.ve_detection_idx
          WHERE ${baseWhere.join(' AND ')} AND d.parking_idx = ?
          ORDER BY a.sent_at DESC`,
        [...params, parkingIdx]
      );
    } else {
      rows = await db.query(
        `SELECT a.alert_idx, a.violation_idx, a.alert_type, a.alert_msg, a.sent_at,
                a.is_success, a.admin_id, a.read_at, a.admin_status, a.admin_content, a.processed_at
           FROM tb_alert a
          WHERE ${baseWhere.join(' AND ')}
          ORDER BY a.sent_at DESC`,
        params
      );
    }
    res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/alerts', err);
    next(err);
  }
});

// PATCH /api/alerts/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: '?�못??ID' });
    const updates = [];
    const params = [];

    const { read, admin_status, admin_content } = req.body || {};
    if (read === true) {
      updates.push('read_at = NOW()');
    }
    if (typeof admin_status !== 'undefined') {
      updates.push('admin_status = ?');
      params.push(admin_status);
    }
    if (typeof admin_content !== 'undefined') {
      updates.push('admin_content = ?');
      params.push(admin_content);
    }
    if (admin_status || admin_content) {
      updates.push('processed_at = NOW()');
    }

    if (!updates.length) {
      return res.status(400).json({ message: '?�데?�트????��???�습?�다.' });
    }

    params.push(id);
    await db.query(
      `UPDATE tb_alert SET ${updates.join(', ')} WHERE alert_idx = ?`,
      params
    );
    res.json({ message: '?�림???�데?�트?�었?�니??' });
  } catch (err) {
    console.error('Error in PATCH /api/alerts/:id', err);
    next(err);
  }
});

module.exports = router;

