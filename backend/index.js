
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// const { Client, GatewayIntentBits } = require('discord.js'); // Will enable later
const PORT = process.env.PORT || 5000;
const setupSwagger = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger
setupSwagger(app);
app.use(helmet());

app.use(morgan('dev'));
app.use('/uploads', express.static('uploads')); // Serve files

const session = require('express-session');
const passport = require('./config/passport');
app.use(session({ secret: process.env.JWT_SECRET || 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


// Database Connection
const connectDB = require('./config/db');
connectDB();



// Routes

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));

app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/audit-logs', require('./routes/auditLogRoutes'));

// Seed Permissions on Start
const { seedDefaultPermissions } = require('./controllers/permissionController');
const roleController = require('./controllers/roleController');

// Wait for DB before seeding (simple hook)
mongoose.connection.once('open', async () => {
    await seedDefaultPermissions();
    // Auto-seed roles if user requested "defaultly load"
    // Mocking request/response for the controller function or refactoring it to be standalone
    // Refactoring controller to have a standalone helper is better, but for now calling it with mock objects or extracting logic
    // Let's call the controller function with a mock req/res to reuse logic quickly without refactor risk
    const mockReq = { body: {}, user: { _id: 'system' } };
    const mockRes = { json: () => { }, status: () => ({ json: () => { } }) };
    await roleController.seedDefaultRoles(mockReq, mockRes);
});


app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/communication', require('./routes/communicationRoutes')); // New Module
app.use('/api/tasks', require('./routes/taskRoutes'));

app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/targets', require('./routes/targetRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));





app.get('/', (req, res) => {
    res.send('CIMS Backend is Running');
});


// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// Discord Bot Setup
const { startBot } = require('./bot/index');
if (process.env.DISCORD_TOKEN) {
    startBot();
} else {
    console.warn('DISCORD_TOKEN not found, skipping Bot login.');
}

