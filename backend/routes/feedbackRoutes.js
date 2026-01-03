
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', feedbackController.createFeedback);
router.get('/:studentId', feedbackController.getStudentFeedback);

module.exports = router;
