
const { SlashCommandBuilder } = require('discord.js');
const Attendance = require('../../models/Attendance');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backin')
        .setDescription('Return from break'),
    async execute(interaction) {
        const discordId = interaction.user.id;
        try {
            const user = await User.findOne({ discordId });
            if (!user) return interaction.reply({ content: 'User not registered in CIMS.', ephemeral: true });

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const attendance = await Attendance.findOne({
                user: user._id,
                date: { $gte: startOfDay },
                clockOutTime: null
            });

            if (!attendance) return interaction.reply({ content: 'You are not clocked in!', ephemeral: true });
            if (!attendance.isBreakActive) return interaction.reply({ content: 'You are not on a break!', ephemeral: true });

            // End Break
            const lastBreak = attendance.breaks[attendance.breaks.length - 1];
            if (lastBreak && !lastBreak.endTime) {
                lastBreak.endTime = new Date();

                // Calculate duration
                const durationMs = lastBreak.endTime - lastBreak.startTime;
                const durationMins = Math.floor(durationMs / 60000);
                attendance.totalBreakMinutes += durationMins;
            }

            attendance.isBreakActive = false;
            await attendance.save();

            await interaction.reply({ content: `▶️ Welcome back, ${user.username}! Break ended.`, ephemeral: false });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error processing command.', ephemeral: true });
        }
    },
};
