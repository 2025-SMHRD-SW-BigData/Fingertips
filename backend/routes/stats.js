const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// 통계 데이터 조회 라우트
router.get('/by-type', statsController.getViolationsByType);
router.get('/by-date', statsController.getViolationsByDate);
router.get('/by-location', statsController.getViolationsByLocation);

module.exports = router;