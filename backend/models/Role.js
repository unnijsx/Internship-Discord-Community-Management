
const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    discordRoleId: {
        type: String,
        required: false,
        unique: true
    },
    permissions: {
        type: Map,
        of: Boolean,
        default: {}
    },
    accessiblePages: [{
        type: String // e.g., '/sales', '/users'
    }],
    parentRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    color: { // Hex color for Discord Role
        type: String,
        default: '#99AAB5'
    }
}, { timestamps: true });

module.exports = mongoose.model('Role', RoleSchema);
