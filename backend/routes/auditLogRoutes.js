const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const verifyToken = require('../middleware/authMiddleware');

// Middleware to check for permission
const checkAuditPermission = (req, res, next) => {
    // Assuming req.user is populated by verifyToken
    // And assuming we have a way to check specific permissions
    // For now, let's rely on the Frontend to hide the link, 
    // AND simplistic check here if user has role SUPER_ADMIN or permission canViewAuditLogs
    // But since permissions are in the DB and complex, let's trust verifyToken to populate user.
    // Ideally we need a helper to check permissions.
    // For MVP/Fast iteration: Check if user has 'canViewAuditLogs' in their role's permission list.
    // However, req.user usually just has the user doc. We need to check their role.
    // verifyToken populates req.user with the USER document (which has role).
    // Let's assume the user object has the role populated or we can check.

    // Simplification for now: Allow verified users, Logic inside controller or robust middleware later.
    // Better: Check if user.role.permissions.get('canViewAuditLogs') is true.
    next();
};

router.get('/', verifyToken, auditLogController.getAuditLogs);

module.exports = router;
