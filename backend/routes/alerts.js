const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/alerts?status=unread|all (default: all)
router.get('/', async (req, res, next) => {
  try {
    const adminId = (req.query.admin_id || '').toString().trim();
    if (!adminId) return res.status(400).json({ message: 'admin_id가 필요합니다.' });

    const status = (req.query.status || 'all').toString();
    const where = ['admin_id = ?'];
    const params = [adminId];
    if (status === 'unread') {
      where.push('read_at IS NULL');
    }
    const rows = await db.query(
      `SELECT alert_idx, violation_idx, alert_type, alert_msg, sent_at, is_success, admin_id, read_at, admin_status, admin_content, processed_at
         FROM tb_alert
        WHERE ${where.join(' AND ')}
        ORDER BY sent_at DESC`,
      params
    );
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
    if (!Number.isFinite(id)) return res.status(400).json({ message: '잘못된 ID' });
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
      return res.status(400).json({ message: '업데이트할 항목이 없습니다.' });
    }

    params.push(id);
    await db.query(
      `UPDATE tb_alert SET ${updates.join(', ')} WHERE alert_idx = ?`,
      params
    );
    res.json({ message: '알림이 업데이트되었습니다.' });
  } catch (err) {
    console.error('Error in PATCH /api/alerts/:id', err);
    next(err);
  }
});

module.exports = router;
