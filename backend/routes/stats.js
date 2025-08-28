const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 통계 라우트
router.get('/by-type', statsController.getViolationsByType);
router.get('/by-date', statsController.getViolationsByDate);
router.get('/by-location', statsController.getViolationsByLocation);
router.get('/by-hour', statsController.getViolationsByHour);

module.exports = router;

