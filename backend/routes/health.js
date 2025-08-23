const express = require('express');
const router = express.Router();
const { ping, query } = require('../services/db');

router.get('/db', async (req, res) => {
  const start = Date.now();
  try {
    await ping();
    const latencyMs = Date.now() - start;
    res.json({ ok: true, latencyMs, now: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

module.exports = router;

