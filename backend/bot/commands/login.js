
const { SlashCommandBuilder } = require('discord.js');
const { handleDiscordLogin } = require('../../controllers/attendanceController');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Clock In for the day.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const result = await handleDiscordLogin(interaction.user.id);

        // Log to attendance-logs channel if success
        if (result.success) {
            const logChannel = interaction.guild.channels.cache.find(c => c.name === 'attendance-logs');
            if (logChannel) logChannel.send(`🟢 **${interaction.user.username}** clocked in via Discord.`);
        }

        await interaction.editReply(result.message);
    },
};
