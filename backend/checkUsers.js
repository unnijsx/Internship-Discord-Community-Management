const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./config/db');

const checkUsers = async () => {
    await connectDB();
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    users.forEach(u => console.log(`- ${u.email} (SuperAdmin: ${u.isSuperAdmin})`));

    const adminUser = await User.findOne({ email: 'admin@cims.com' });
    if (!adminUser) {
        console.log('Default admin not found. Creating...');
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const admin = new User({
            username: 'SuperAdmin',
            email: 'admin@cims.com',
            password: hashedPassword,
            discordId: 'admin_local',
            isSuperAdmin: true,
            roles: [] // ensure no error
        });
        await admin.save();
        console.log('Created admin@cims.com / password123');
    } else {
        console.log('Admin user already exists.');
    }
    process.exit();
};

checkUsers();
