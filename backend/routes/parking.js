const express = require('express');
const db = require('../services/db');

const router = express.Router();

// GET /api/parking
router.get('/', async (req, res, next) => {
  try {
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

