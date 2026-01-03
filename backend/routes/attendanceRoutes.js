const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/scan', attendanceController.handleQRScan);
router.post('/mark', attendanceController.markAttendance); // Bot usage mostly
router.get('/:userId', attendanceController.getAttendanceHistory);

module.exports = router;
