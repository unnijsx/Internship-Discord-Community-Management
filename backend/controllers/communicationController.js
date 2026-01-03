
const Broadcast = require('../models/Broadcast');
const Ticket = require('../models/Ticket');
const { client } = require('../bot/index');

// --- Broadcasts ---
exports.createBroadcast = async (req, res) => {
    try {
        const { title, message, targetRoles, sendToDiscord } = req.body;
        const broadcast = new Broadcast({
            title,
            message,
            author: req.user._id,
            targetRoles,
            sentToDiscord: sendToDiscord || false
        });

        if (sendToDiscord) {
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
            if (guild) {
                // Use selected channel OR default to announcements OR default to system
                const targetChannelId = req.body.targetChannelId;
                let channel;

                if (targetChannelId) {
                    channel = guild.channels.cache.get(targetChannelId);
                }

                if (!channel) {
                    channel = guild.channels.cache.find(c => c.name === 'announcements') || guild.systemChannel;
                }

                if (channel) {
                    const sentMsg = await channel.send({
                        content: `📢 **${title}**\n${message}\n\n*Sent by ${req.user.username}*`
                    });
                    broadcast.discordMessageId = sentMsg.id;
                }
            }
        }

        await broadcast.save();
        res.status(201).json(broadcast);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Broadcast.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(broadcasts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getChannels = async (req, res) => {
    try {
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID);
        if (!guild) return res.status(404).json({ message: 'Guild not found' });

        // Fetch text channels properly - check if cache is sufficient or fetch
        // 0 = GUILD_TEXT
        const channels = guild.channels.cache
            .filter(c => c.type === 0 || c.type === 5) // Text or News
            .map(c => ({ id: c.id, name: c.name }));

        res.json(channels);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Tickets ---
exports.createTicket = async (req, res) => {
    try {
        const ticket = new Ticket({
            ...req.body,
            creator: req.user._id
        });
        await ticket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getTickets = async (req, res) => {
    try {
        // If admin, see all. If student, see own.
        const filter = req.user.isSuperAdmin || req.user.roles.some(r => r.permissions?.canManageSupport)
            ? {}
            : { creator: req.user._id };

        const tickets = await Ticket.find(filter)
            .populate('creator', 'username')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(ticket);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
