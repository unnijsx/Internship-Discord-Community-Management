
const { SlashCommandBuilder } = require('discord.js');
const { handleDiscordLogout } = require('../../controllers/attendanceController');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logout')
        .setDescription('Clock Out for the day.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const result = await handleDiscordLogout(interaction.user.id);

        if (result.success) {
            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'attendance-logs');
            if (logChannel) logChannel.send(`🔴 **${interaction.user.username}** clocked out via Discord. Duration: ${result.message.split('Duration: ')[1]}`);
        }

        await interaction.editReply(result.message);
    },
};
