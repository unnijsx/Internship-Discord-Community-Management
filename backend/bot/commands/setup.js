
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Role = require('../../models/Role'); // Import Role Model

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sets up the server roles and channels based on the configuration.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;

        try {
            // 1. Create Basic Roles if they don't exist
            // This reads from our Database to see what roles defined in Web need to be here
            // But for initial setup, we might want to ensure "Admin", "Trainer", "Student" exist?
            // Let's rely on DB as source of truth.

            const dbRoles = await Role.find({});
            let createdCount = 0;

            for (const r of dbRoles) {
                let discordRole = guild.roles.cache.find(role => role.name === r.name);
                if (!discordRole) {
                    discordRole = await guild.roles.create({
                        name: r.name,
                        color: r.color || '#99AAB5',
                        reason: 'Auto-setup via /setup command'
                    });

                    // Update DB with the new ID
                    r.discordRoleId = discordRole.id;
                    await r.save();
                    createdCount++;
                } else if (r.discordRoleId !== discordRole.id) {
                    // Sync ID if name matches but ID doesn't (migration/recovery)
                    r.discordRoleId = discordRole.id;
                    await r.save();
                }
            }

            // 2. Create Basic Categories & Channels
            // We can hardcode standard structure or fetch from a config
            const categoryName = 'CIMS Internships';
            let category = guild.channels.cache.find(c => c.name === categoryName && c.type === ChannelType.GuildCategory);

            if (!category) {
                category = await guild.channels.create({
                    name: categoryName,
                    type: ChannelType.GuildCategory
                });
            }

            // Create 'announcements', 'attendance-logs'
            const channelsToCreate = ['announcements', 'attendance-logs', 'general-chat'];

            for (const chName of channelsToCreate) {
                if (!guild.channels.cache.find(c => c.name === chName && c.parentId === category.id)) {
                    await guild.channels.create({
                        name: chName,
                        type: ChannelType.GuildText,
                        parent: category.id
                    });
                }
            }

            await interaction.editReply(`Setup Complete! Synced/Created ${createdCount} roles and verified channels.`);

        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred during setup.');
        }
    },
};
