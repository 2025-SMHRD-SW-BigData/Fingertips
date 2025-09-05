const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Stats routes
router.get('/by-type', statsController.getViolationsByType);
router.get('/by-date', statsController.getViolationsByDate);
router.get('/by-location', statsController.getViolationsByLocation);
router.get('/by-hour', statsController.getViolationsByHour);
router.get('/by-weekday', statsController.getViolationsByWeekday);

module.exports = router;

