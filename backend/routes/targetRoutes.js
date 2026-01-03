
const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', targetController.createTarget);
router.get('/my', targetController.getMyTargets);
router.get('/assigned', targetController.getAssignedTargets); // For Leads
router.put('/:targetId/progress', targetController.updateProgress);

module.exports = router;
