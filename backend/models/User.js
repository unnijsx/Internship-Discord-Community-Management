
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true // Discord might not provide email always
    },
    avatar: String,
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    password: { // For Super Admin / Non-Discord Users
        type: String,
        select: false // Do not return by default
    },
    isSuperAdmin: { // Boolean flag for hardcoded admin access
        type: Boolean,
        default: false
    }
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);

