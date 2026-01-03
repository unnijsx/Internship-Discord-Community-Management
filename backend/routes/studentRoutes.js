
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllStudents, addMark, getStudentStats } = require('../controllers/studentController');

// Helper middleware to check permission? For now open/admin check later
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/stats', getStudentStats); // Order matters! specific before generic
router.get('/', getAllStudents);
router.get('/:userId', getProfile);
router.put('/:userId', updateProfile);
router.post('/:id/marks', addMark);

module.exports = router;
