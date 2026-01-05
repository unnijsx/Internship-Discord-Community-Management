const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/generate-qr', attendanceController.generateQR);
router.post('/scan', attendanceController.handleQRScan);
router.post('/mark', attendanceController.markAttendance); // Bot usage mostly
router.get('/', attendanceController.getAllAttendance);
router.get('/:userId', attendanceController.getAttendanceHistory);

module.exports = router;
