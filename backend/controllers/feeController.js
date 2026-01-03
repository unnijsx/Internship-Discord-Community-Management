
const FeeRecord = require('../models/FeeRecord');

const createFeeRecord = async (req, res) => {
    try {
        const fee = new FeeRecord({
            student: req.body.studentId,
            amount: req.body.amount,
            type: req.body.type,
            collectedBy: req.body.collectedBy, // from token/req.user
            status: req.body.status || 'Completed',
            remarks: req.body.remarks
        });
        await fee.save();

        // --- Discord Notification ---
        try {
            const { client } = require('../bot/index');
            const User = require('../models/User');

            // Find student to get name
            const student = await User.findById(fee.student);
            const studentName = student ? student.username : 'Unknown Student';

            // Find System Channel (usually general) or specific one
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
            if (guild) {
                // Try to find a channel named 'fees' or 'sales', fallback to systemChannel
                const channel = guild.channels.cache.find(c => c.name === 'sales' || c.name === 'fees') || guild.systemChannel;

                if (channel) {
                    const embed = {
                        color: 0x00FF00,
                        title: '💰 New Payment Received',
                        fields: [
                            { name: 'Student', value: studentName, inline: true },
                            { name: 'Amount', value: `$${fee.amount}`, inline: true },
                            { name: 'Type', value: fee.type, inline: true },
                            { name: 'Recorded By', value: req.body.collectedBy || 'Admin', inline: true },
                        ],
                        timestamp: new Date(),
                    };
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (discordErr) {
            console.error('Discord fee notification failed:', discordErr);
        }

        res.status(201).json(fee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getFees = async (req, res) => {
    try {
        const fees = await FeeRecord.find().populate('student').populate('collectedBy', 'username');
        res.json(fees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getStudentFees = async (req, res) => {
    try {
        const fees = await FeeRecord.find({ student: req.params.studentId });
        res.json(fees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createFeeRecord, getFees, getStudentFees };
