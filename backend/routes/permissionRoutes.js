
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const auth = require('../models/User'); // Middleware placeholder if needed

// Add middleware to protect these routes (e.g. only Super Admin)
// For now, assuming anyone with access to dashboard might hit this, but we should restrict updates.

router.get('/', permissionController.getPermissions);
router.post('/', permissionController.createPermission);
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
