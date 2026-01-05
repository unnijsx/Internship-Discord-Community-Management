const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const verifyToken = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/', teamController.createTeam);
router.get('/', teamController.getTeams);
router.post('/assign', teamController.assignUser);
router.get('/my-team', teamController.getMyTeam);

module.exports = router;
