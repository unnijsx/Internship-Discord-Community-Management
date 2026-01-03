
const { SlashCommandBuilder } = require('discord.js');
const Attendance = require('../../models/Attendance');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('break')
        .setDescription('Take a break from work'),
    async execute(interaction) {
        const discordId = interaction.user.id;
        try {
            const user = await User.findOne({ discordId });
            if (!user) return interaction.reply({ content: 'User not registered in CIMS.', ephemeral: true });

            // Find today's active attendance
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const attendance = await Attendance.findOne({
                user: user._id,
                date: { $gte: startOfDay },
                clockOutTime: null
            });

            if (!attendance) return interaction.reply({ content: 'You are not clocked in!', ephemeral: true });
            if (attendance.isBreakActive) return interaction.reply({ content: 'You are already on a break!', ephemeral: true });

            // Start Break
            attendance.breaks.push({ startTime: new Date() });
            attendance.isBreakActive = true;
            await attendance.save();

            await interaction.reply({ content: `⏸️ Break started for ${user.username}. Enjoy your time!`, ephemeral: false });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Error processing break.', ephemeral: true });
        }
    },
};
