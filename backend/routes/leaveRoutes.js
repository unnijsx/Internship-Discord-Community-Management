
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', leaveController.applyLeave);
router.get('/', leaveController.getLeaves);
router.put('/:id', leaveController.updateLeaveStatus);

module.exports = router;
