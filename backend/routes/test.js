const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/test-db', testController.testDB);

module.exports = router;