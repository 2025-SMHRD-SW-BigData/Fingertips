const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/parking
// Optional query: ?district=<code>
// Note: As of current schema, tb_parking has no district column.
// When district is provided, we interpret it as a direct mapping to PARKING_IDX and filter accordingly.
router.get('/', async (req, res, next) => {
  try {
    const { district } = req.query || {};
    if (district && String(district).trim() !== '') {
      const code = parseInt(String(district).trim(), 10);
      if (Number.isFinite(code)) {
        const rows = await db.query(
          'SELECT PARKING_IDX AS parking_idx, PARKING_LOC AS parking_loc FROM tb_parking WHERE PARKING_IDX = ? ORDER BY PARKING_IDX',
          [code]
        );
        return res.json(rows);
      }
    }
    const rows = await db.query(
      'SELECT PARKING_IDX AS parking_idx, PARKING_LOC AS parking_loc FROM tb_parking ORDER BY PARKING_IDX'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/parking', err);
    next(err);
  }
});

module.exports = router;
