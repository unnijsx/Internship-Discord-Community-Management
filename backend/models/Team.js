const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: String,
    parentTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    lead: { // The head of this specific team/sub-team
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [{ // Optional: Can query by User.team instead, but this helps cache
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
