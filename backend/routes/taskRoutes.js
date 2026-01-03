
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Add auth middleware here if not globally applied for this route path
// router.use(require('../middleware/auth')); 
const verifyToken = require('../middleware/authMiddleware');
router.use(verifyToken);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
