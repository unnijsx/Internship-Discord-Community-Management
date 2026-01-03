
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedSuperAdmin = async () => {
    try {
        const email = 'admin@gmail.com';
        const password = 'admin@123';

        let admin = await User.findOne({ email });

        if (admin) {
            console.log('Super Admin already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        admin = new User({
            username: 'Super Admin',
            email: email,
            password: hashedPassword,
            discordId: `admin_seed_${Date.now()}`,
            isActive: true,
            isSuperAdmin: true,
            avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=random' // Default avatar
        });

        await admin.save();
        console.log(`Super Admin Created: ${email} / ${password}`);

    } catch (err) {
        console.error('Error seeding Super Admin:', err);
    }
};

module.exports = seedSuperAdmin;
