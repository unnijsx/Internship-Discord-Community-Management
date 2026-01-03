
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { client } = require('../bot/index');

const getRoles = async (req, res) => {
    try {
        const roles = await Role.find().populate('parentRole');
        res.json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const createRole = async (req, res) => {
    const { name, permissions, accessiblePages, parentRole, color } = req.body;
    try {
        // 1. Create Role in Discord
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!guild) return res.status(500).json({ message: 'Discord Guild not found' });

        const discordRole = await guild.roles.create({
            name: name,
            color: color || '#99AAB5',
            reason: 'Role created via CIMS Dashboard'
        });

        // 2. Create Role in DB
        const newRole = new Role({
            name,
            discordRoleId: discordRole.id,
            permissions,
            accessiblePages,
            parentRole,
            color
        });

        await newRole.save();

        // Audit Log
        await AuditLog.create({
            action: 'CREATE_ROLE',
            performedBy: req.user._id,
            target: newRole._id,
            details: `Created role: ${name}`
        });

        res.status(201).json(newRole);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, permissions, accessiblePages, parentRole, color } = req.body;
    try {
        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        // Sync with Discord
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (guild) {
            const discordRole = guild.roles.cache.get(role.discordRoleId);
            if (discordRole) {
                await discordRole.edit({
                    name: name || discordRole.name,
                    color: color || discordRole.color
                });
            }
        }

        role.name = name || role.name;
        role.permissions = permissions || role.permissions;
        role.accessiblePages = accessiblePages || role.accessiblePages;
        role.parentRole = parentRole || role.parentRole;
        role.color = color || role.color;

        await role.save();

        await AuditLog.create({
            action: 'UPDATE_ROLE',
            performedBy: req.user._id,
            target: role._id,
            details: `Updated role: ${role.name}`
        });

        res.json(role);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteRole = async (req, res) => {
    const { id } = req.params;
    try {
        const role = await Role.findById(id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        // Delete from Discord
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (guild) {
            const discordRole = guild.roles.cache.get(role.discordRoleId);
            if (discordRole) await discordRole.delete('Role deleted via CIMS Dashboard');
        }

        await role.deleteOne();

        await AuditLog.create({
            action: 'DELETE_ROLE',
            performedBy: req.user._id,
            target: id, // Role is gone, keep ID
            details: `Deleted role: ${role.name}`
        });

        res.json({ message: 'Role deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const seedDefaultRoles = async (req, res) => {
    try {
        const defaultRoles = [
            {
                name: 'SUPER_ADMIN',
                color: '#FF0000',
                permissions: {
                    canManageUsers: true, canManageRoles: true, canViewAuditLogs: true, canPostJobs: true,
                    canManageAttendance: true, canManageLeaves: true, canManageSales: true, canManageTasks: true,
                    canManageBroadcasts: true, canManageTickets: true, canManageFeedback: true, canManageSchedules: true
                },
                accessiblePages: ['/', '/users', '/roles', '/permissions', '/attendance', '/materials', '/sales', '/tasks', '/leaves', '/broadcasts', '/tickets', '/feedback', '/targets', '/schedules', '/student', '/audit-logs'] // Added /audit-logs
            },
            {
                name: 'MANAGER',
                color: '#E91E63',
                permissions: {
                    canManageUsers: true, canManageRoles: false, canViewAuditLogs: true,
                    canManageAttendance: true, canManageLeaves: true, canManageSales: true, canManageTasks: true,
                    canManageBroadcasts: true, canManageTickets: true, canManageFeedback: true, canManageSchedules: true
                },
                accessiblePages: ['/users', '/attendance', '/sales', '/leaves', '/broadcasts', '/tickets', '/feedback', '/targets', '/schedules', '/tasks']
            },
            {
                name: 'SALES_DIVISION_LEAD',
                color: '#FFD700', // Gold
                parentRole: 'DIVISION_LEADS',
                permissions: { canManageSales: true, canManageTargets: true, canManageFeedback: true, canManageLeaves: true, canManageBroadcasts: true },
                accessiblePages: ['/sales', '/targets', '/feedback', '/leaves', '/broadcasts']
            },
            {
                name: 'TECH_DIVISION_LEAD',
                color: '#00FA9A',
                parentRole: 'DIVISION_LEADS',
                permissions: { canManageTasks: true, canManageFeedback: true, canManageLeaves: true, canManageBroadcasts: true, canManageAttendance: true },
                accessiblePages: ['/targets', '/feedback', '/leaves', '/attendance', '/broadcasts', '/tasks', '/materials']
            },
            {
                name: 'PROCESS_TEAM',
                color: '#8A2BE2',
                permissions: { canManageAttendance: true, canManageSchedules: true, canManageLeaves: true, canManageBroadcasts: true },
                accessiblePages: ['/schedules', '/attendance', '/leaves', '/broadcasts']
            },
            {
                name: 'DIVISION_LEADS',
                color: '#9C27B0'
            },
            { name: 'SUBDIVISION_LEADS', color: '#673AB7' },
            {
                name: 'ASSOCIATES',
                color: '#3F51B5',
                accessiblePages: ['/leaves', '/broadcasts', '/tickets']
            },
            {
                name: 'TRAINERS',
                color: '#2196F3',
                permissions: { canPostJobs: true, canManageAttendance: true, canManageFeedback: true },
                accessiblePages: ['/materials', '/attendance', '/feedback', '/leaves', '/schedules']
            },
            {
                name: 'SALES',
                color: '#00BCD4',
                permissions: { canManageSales: true },
                accessiblePages: ['/sales', '/targets', '/leaves']
            },
            {
                name: 'MERN_TRAINERS',
                color: '#009688',
                parentRole: 'TRAINERS'
            },
            {
                name: 'PYTHON_TRAINERS',
                color: '#4CAF50',
                parentRole: 'TRAINERS'
            },
            { name: 'PLACEMENT_TEAM', color: '#FF9800', permissions: { canManageTargets: true, canManageBroadcasts: true }, accessiblePages: ['/targets', '/broadcasts'] },
            {
                name: 'STUDENT',
                color: '#607D8B',
                accessiblePages: ['/student', '/materials', '/attendance', '/leaves', '/schedules', '/feedback', '/targets', '/tickets']
            },
            {
                name: 'MERN_STACK_1MONTH_INTERN',
                color: '#4DD0E1',
                parentRole: 'STUDENT',
                accessiblePages: ['/student', '/materials', '/attendance', '/leaves', '/schedules', '/feedback', '/targets', '/tickets']
            },
            {
                name: 'MERN_STACK_2MONTH_INTERN',
                color: '#00BCD4',
                parentRole: 'STUDENT',
                accessiblePages: ['/student', '/materials', '/attendance', '/leaves', '/schedules', '/feedback', '/targets', '/tickets']
            }
        ];

        const createdRoles = [];
        const updatedRoles = [];
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);

        for (const roleDef of defaultRoles) {
            let role = await Role.findOne({ name: roleDef.name });

            // Logic to check if we need to sync to Discord
            let discordRoleId = role?.discordRoleId;
            if (guild) {
                const existingDiscordRole = guild.roles.cache.find(r => r.name === roleDef.name);
                if (existingDiscordRole) {
                    discordRoleId = existingDiscordRole.id;
                } else if (!existingDiscordRole && !role) {
                    // Only create discord role if we are creating a new DB role OR if we really want to force sync.
                    // For safety, let's create if we are making a new role.
                    try {
                        const newDiscordRole = await guild.roles.create({
                            name: roleDef.name,
                            color: roleDef.color || '#99AAB5',
                            reason: 'Auto-seeded by CIMS'
                        });
                        discordRoleId = newDiscordRole.id;
                    } catch (dErr) {
                        console.error(`Failed to create Discord role ${roleDef.name}:`, dErr);
                    }
                }
            }

            if (!role) {
                // CREATE
                try {
                    role = new Role({
                        name: roleDef.name,
                        color: roleDef.color,
                        permissions: roleDef.permissions || {},
                        accessiblePages: roleDef.accessiblePages || [],
                        discordRoleId: discordRoleId || 'PENDING_SYNC' // Placeholder if null
                    });
                    await role.save();
                    createdRoles.push(role.name);
                    console.log(`[SEED] Created new role: ${role.name}`);
                } catch (saveErr) {
                    if (saveErr.code === 11000) {
                        // Race condition: Role exists now. Fetch and update.
                        console.log(`[SEED] Race condition detected for ${roleDef.name}. Updating instead.`);
                        role = await Role.findOne({ name: roleDef.name });
                        // Fall through to update logic below...
                    } else {
                        throw saveErr; // Real error
                    }
                }
            }

            // If role exists (either found originally or recovered from race condition)
            if (role) {
                // UPDATE (Upsert checks)
                // Check if accessiblePages or permissions are missing/different, simplified update
                let needsSave = false;

                // Update accessible pages if undefined or empty in DB but defined in seed
                if (roleDef.accessiblePages && (!role.accessiblePages || role.accessiblePages.length === 0)) {
                    role.accessiblePages = roleDef.accessiblePages;
                    needsSave = true;
                }

                // Update specific permissions if missing
                if (roleDef.permissions) {
                    // For Map type in Mongoose, we should use .get() and .set()
                    // But if it was fetched as POJO via lean() it would be object. Here it is a Document.
                    if (!role.permissions) role.permissions = new Map();

                    for (const [key, val] of Object.entries(roleDef.permissions)) {
                        const currentVal = role.permissions.get(key);
                        if (currentVal !== val) {
                            role.permissions.set(key, val);
                            needsSave = true;
                        }
                    }
                }

                if (needsSave) {
                    await role.save();
                    updatedRoles.push(role.name);
                    console.log(`[SEED] Updated existing role: ${role.name}`);
                }
            }
        }

        console.log(`Seeding Complete. Created: ${createdRoles.length}, Updated: ${updatedRoles.length}`);
        if (res && res.json) res.json({ message: 'Roles seeded/updated successfully', created: createdRoles, updated: updatedRoles });

    } catch (err) {
        console.error("Seeding Error:", err);
        if (res && res.status) res.status(500).json({ message: err.message });
    }
};

module.exports = { getRoles, createRole, updateRole, deleteRole, seedDefaultRoles };
