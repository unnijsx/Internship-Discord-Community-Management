
const Permission = require('../models/Permission');

// Get all permissions
exports.getPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find().sort({ name: 1 });
        res.json(permissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new permission
exports.createPermission = async (req, res) => {
    const { name, slug, description } = req.body;
    try {
        const newPermission = new Permission({ name, slug, description });
        await newPermission.save();
        res.status(201).json(newPermission);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a permission
exports.deletePermission = async (req, res) => {
    try {
        await Permission.findByIdAndDelete(req.params.id);
        res.json({ message: 'Permission deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Seed default permissions if empty (optional helper)
exports.seedDefaultPermissions = async () => {
    const defaults = [
        { name: 'View Logs', slug: 'canViewAuditLogs', description: 'Access to system audit logs' },
        { name: 'Post Jobs/Materials', slug: 'canPostJobs', description: 'Ability to upload materials and post tasks' },
        { name: 'Manage Users', slug: 'canManageUsers', description: 'Create, edit, and assign roles to users' },
        { name: 'Manage Roles', slug: 'canManageRoles', description: 'Create and modify system roles and permissions' },
        { name: 'Manage Attendance', slug: 'canManageAttendance', description: 'View and modify attendance records' },
        { name: 'Manage Leaves', slug: 'canManageLeaves', description: 'Approve or reject leave applications' },
        { name: 'Manage Sales', slug: 'canManageSales', description: 'Access sales dashboard and manage fees' },
        { name: 'Manage Tasks', slug: 'canManageTasks', description: 'Create, assign, and track tasks' },
        { name: 'Manage Broadcasts', slug: 'canManageBroadcasts', description: 'Send broadcasts to Discord channels' },
        { name: 'Manage Tickets', slug: 'canManageTickets', description: 'View and resolve support tickets' },
        { name: 'Manage Feedback', slug: 'canManageFeedback', description: 'Give feedback to students' },
        { name: 'Manage Schedules', slug: 'canManageSchedules', description: 'Create and manage class schedules' },
    ];

    for (const perm of defaults) {
        // Try to finding by slug OR name to prevent unique constraint errors (e.g. if slug changed but name is same)
        const existing = await Permission.findOne({
            $or: [{ slug: perm.slug }, { name: perm.name }]
        });

        if (existing) {
            // Update existing
            existing.name = perm.name;
            existing.slug = perm.slug;
            existing.description = perm.description;
            await existing.save();
        } else {
            // Create new
            await Permission.create(perm);
        }
    }
    console.log('Permissions seeded/updated');
};
