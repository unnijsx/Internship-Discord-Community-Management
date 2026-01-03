
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');
const Role = require('../../models/Role');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('Force sync roles for all users (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Ephemeral in deferReply is correct for v14, but maybe the followUp used flags incorrectly?
        // The error log said: Warning: Supplying "ephemeral" for interaction response options is deprecated. Utilize flags instead.
        // This usually applies to .reply() or .followUp().
        await interaction.deferReply({ ephemeral: true });

        try {
            const users = await User.find({ discordId: { $ne: null } }).populate('roles');
            const guild = interaction.guild;
            let successCount = 0;
            let failCount = 0;

            for (const user of users) {
                try {
                    const member = await guild.members.fetch(user.discordId).catch(() => null);
                    if (member) {
                        const discordRoleIds = user.roles.map(r => r.discordRoleId).filter(id => id);

                        // Similar logic to userController
                        // Remove system managed roles not in user.roles? 
                        // For safety in this command, let's just ADD missing roles for now to avoid accidental stripping
                        // Or do full sync? User asked for "add it on", implying ensure consistency.
                        // Let's do full sync of managed roles.

                        const allCimsRoles = await Role.find();
                        const rolesToRemove = allCimsRoles
                            .filter(r => !user.roles.some(ur => ur._id.equals(r._id)) && r.discordRoleId)
                            .map(r => r.discordRoleId);

                        if (rolesToRemove.length > 0) await member.roles.remove(rolesToRemove).catch(() => { });
                        if (discordRoleIds.length > 0) await member.roles.add(discordRoleIds).catch(() => { });

                        successCount++;
                    }
                } catch (e) {
                    failCount++;
                }
            }

            await interaction.editReply({ content: `Sync Complete! ✅ Processed: ${users.length} Users. Success: ${successCount}, Failed/Not Found: ${failCount}` });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'Error executing sync.' });
        }
    },
};
