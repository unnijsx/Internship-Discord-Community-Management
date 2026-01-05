const Team = require('../models/Team');
const User = require('../models/User');

// Create a new Team or Sub-Team
const createTeam = async (req, res) => {
    try {
        const { name, description, parentTeamId, leadId } = req.body;

        const team = new Team({
            name,
            description,
            parentTeam: parentTeamId || null,
            lead: leadId || null
        });

        await team.save();
        res.status(201).json(team);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all teams (nested structure?)
const getTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('lead', 'username').populate('parentTeam', 'name');
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Assign User to Team and Manager
const assignUser = async (req, res) => {
    try {
        const { userId, teamId, reportsToId, designation } = req.body;

        const updateData = {};
        if (teamId) updateData.team = teamId;
        if (reportsToId) updateData.reportsTo = reportsToId;
        if (designation) updateData.designation = designation;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        // Also update Team members list
        if (teamId) {
            await Team.findByIdAndUpdate(teamId, { $addToSet: { members: userId } });
        }

        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get Hierarchy: Users reporting to me (Recursive or Direct)
const getMyTeam = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Direct reports
        const directReports = await User.find({ reportsTo: userId }).select('username email designation team avatar');

        // 2. If I am a Team Lead, get all team members? 
        // Logic: if user is designated 'Lead' or 'Manager', maybe show whole team. 
        // For now, let's stick to 'reportsTo' tree or 'Team' membership.

        // Let's fetch the team I lead
        const leadingTeam = await Team.findOne({ lead: userId }).populate({
            path: 'members',
            select: 'username email designation avatar'
        });

        res.json({
            directReports,
            teamLeading: leadingTeam ? leadingTeam.members : []
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createTeam,
    getTeams,
    assignUser,
    getMyTeam
};
