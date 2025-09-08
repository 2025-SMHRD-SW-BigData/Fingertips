const express = require('express');
const db = require('../services/db');

const router = express.Router();

function toInt(val, fallback) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseSort(raw) {
  const def = { col: 'pl.entry_at', dir: 'DESC' };
  const s = (raw || '').toString().trim();
  if (!s) return def;
  const [k, v] = s.split(':');
  const col = (k || '').trim();
  const dir = (v || '').trim().toUpperCase();
  if (col !== 'entry_at') return def; // restrict to safe columns
  if (dir !== 'ASC' && dir !== 'DESC') return def;
  return { col: `pl.${col}`, dir };
}

// GET /api/parking-logs
// Query: page, limit, parking_idx, search, from, to, sort (entry_at:desc|entry_at:asc)
router.get('/', async (req, res, next) => {
  try {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const offset = (page - 1) * limit;

    const parkingIdx = parseInt(req.query.parking_idx, 10);
    const hasParking = Number.isFinite(parkingIdx);

    const search = (req.query.search || '').toString().trim();
    const from = (req.query.from || '').toString().trim();
    const to = (req.query.to || '').toString().trim();
    const { col, dir } = parseSort(req.query.sort);

    const where = [];
    const params = [];

    if (hasParking) {
      where.push('ps.parking_idx = ?');
      params.push(parkingIdx);
    }
    if (search) {
      where.push('(pl.ve_number LIKE ? OR CAST(pl.space_id AS CHAR) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (from) {
      where.push('DATE(pl.entry_at) >= ?');
      params.push(from);
    }
    if (to) {
      where.push('DATE(pl.entry_at) <= ?');
      params.push(to);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS cnt
        FROM tb_parking_log pl
        LEFT JOIN tb_parking_space ps ON ps.space_id = pl.space_id
      ${whereSql}
    `;
    const countRows = await db.query(countSql, params);
    const totalItems = countRows[0]?.cnt || 0;

    const listSql = `
      SELECT pl.log_idx, pl.ve_number, v.ve_img, pl.space_id, pl.entry_at, pl.exit_at
        FROM tb_parking_log pl
        LEFT JOIN tb_vehicle v ON pl.ve_number = v.ve_number
        LEFT JOIN tb_parking_space ps ON ps.space_id = pl.space_id
      ${whereSql}
       ORDER BY ${col} ${dir}
       LIMIT ? OFFSET ?
    `;
    const data = await db.query(listSql, [...params, limit, offset]);

    res.json({
      items: data,
      pagination: {
        totalItems,
        totalPages: Math.max(1, Math.ceil((totalItems || 0) / limit)),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/parking-logs', err);
    next(err);
  }
});

module.exports = router;
