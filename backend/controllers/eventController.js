
const Event = require('../models/Event');
const schedule = require('node-schedule');
const { client } = require('../bot/index');
const { ChannelType, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType } = require('discord.js');

// Store scheduled jobs in memory (restart resets them - in production use Redis/Agenda)
const jobs = {};

const createEvent = async (req, res) => {
    try {
        const { title, description, startTime, endTime, batch, meetingLink, trainer } = req.body;

        const event = new Event({
            title, description, startTime, endTime, batch, meetingLink, trainer
        });

        // 1. Create Discord Event
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (guild) {
            try {
                const discordEvent = await guild.scheduledEvents.create({
                    name: title,
                    scheduledStartTime: new Date(startTime),
                    scheduledEndTime: new Date(endTime),
                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                    entityType: meetingLink ? GuildScheduledEventEntityType.External : GuildScheduledEventEntityType.Voice,
                    entityMetadata: meetingLink ? { location: meetingLink } : { location: 'General Voice' },
                    description: description,
                    reason: 'Class Scheduled via CIMS'
                });
                event.discordEventId = discordEvent.id;
            } catch (discordErr) {
                console.error('Discord Event Creation Failed:', discordErr);
            }
        }

        await event.save();

        // 2. Schedule Reminder (15 mins before)
        const reminderTime = new Date(new Date(startTime).getTime() - 15 * 60000);
        if (reminderTime > new Date()) {
            const jobId = `reminder_${event._id}`;
            jobs[jobId] = schedule.scheduleJob(reminderTime, async () => {
                // Send Message to Announcements Channel
                const channel = guild.channels.cache.find(c => c.name === 'announcements');
                if (channel) {
                    channel.send(`📢 **Class Reminder**: ${title} starts in 15 minutes! @${batch || 'everyone'} \nLink: ${meetingLink || 'Check Voice Channels'}`);
                }
            });
        }

        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ startTime: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createEvent, getEvents };
