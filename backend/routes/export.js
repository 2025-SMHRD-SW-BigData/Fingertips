const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Export routes
router.get('/csv', exportController.exportStatsCSV);
router.get('/excel', exportController.exportStatsExcel);

module.exports = router;