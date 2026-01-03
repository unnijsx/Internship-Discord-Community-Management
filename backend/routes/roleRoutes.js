
const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole, seedDefaultRoles } = require('../controllers/roleController');
const verifyToken = require('../middleware/authMiddleware');

// Protect all role routes
router.use(verifyToken);

router.get('/', getRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

// Seed Default Roles
router.post('/seed', seedDefaultRoles);

module.exports = router;
