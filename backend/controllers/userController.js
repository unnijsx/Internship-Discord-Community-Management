
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { client } = require('../bot/index');

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().populate('roles');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign/Remove Role to User
exports.updateUserRoles = async (req, res) => {
    const { userId } = req.params;
    const { roles } = req.body; // Array of Role IDs
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.roles = roles;
        await user.save();

        // --- Discord Sync ---
        try {
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
            if (guild && user.discordId) {
                const member = await guild.members.fetch(user.discordId).catch(() => null);
                if (member) {
                    // Fetch full role objects to get discordRoleIds
                    const assignedRoles = await Role.find({ _id: { $in: roles } });
                    const discordRoleIds = assignedRoles.map(r => r.discordRoleId).filter(id => id);

                    // Note: This replaces all roles managed by the bot. Be careful if they have manual roles.
                    // A safer approach is to remove CIMS-managed roles and add new ones.
                    // For MVP, we'll try to sync specific roles.

                    // Simple strategy: Iterate all CIMS roles, remove if not in 'roles', add if in 'roles'
                    const allCimsRoles = await Role.find();
                    const rolesToRemove = allCimsRoles
                        .filter(r => !roles.includes(r._id.toString()) && r.discordRoleId)
                        .map(r => r.discordRoleId);

                    await member.roles.remove(rolesToRemove).catch(console.error);
                    await member.roles.add(discordRoleIds).catch(console.error);
                }
            }
        } catch (syncErr) {
            console.error('Discord user role sync failed:', syncErr);
            // Don't fail the API request if Discord sync fails, just log it.
        }

        // --- Audit Log ---
        await AuditLog.create({
            action: 'UPDATE_USER_ROLES',
            performedBy: req.user._id, // Assumes auth middleware populates req.user
            target: user._id,
            details: `Assigned roles: ${roles.join(', ')}`
        });

        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Toggle Super Admin status (Optional, use carefully)
exports.toggleSuperAdmin = async (req, res) => {
    const { userId } = req.params;
    const { isSuperAdmin } = req.body;
    try {
        const user = await User.findByIdAndUpdate(userId, { isSuperAdmin }, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
