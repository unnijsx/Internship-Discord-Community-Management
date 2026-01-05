
const Attendance = require('../models/Attendance');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// Helper to calculate duration
const calculateDuration = (start, end) => {
    return Math.round((end - start) / 1000 / 60); // minutes
};

// Discord / Login Command Logic (called from Bot)
const handleDiscordLogin = async (discordId) => {
    const user = await User.findOne({ discordId });
    if (!user) return { success: false, message: 'User not registered in system.' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ user: user._id, date: today });

    if (attendance) {
        return { success: false, message: 'You have already clocked in today.' };
    }

    attendance = new Attendance({
        user: user._id,
        date: today,
        clockInTime: new Date(),
        method: 'Discord',
        status: 'Present'
    });

    await attendance.save();
    return { success: true, message: `Clocked in at ${new Date().toLocaleTimeString()}` };
};

// Discord / Logout Command Logic
const handleDiscordLogout = async (discordId) => {
    const user = await User.findOne({ discordId });
    if (!user) return { success: false, message: 'User not registered.' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ user: user._id, date: today });
    if (!attendance) return { success: false, message: 'You have not clocked in today.' };
    if (attendance.clockOutTime) return { success: false, message: 'You have already clocked out.' };

    attendance.clockOutTime = new Date();
    attendance.durationMinutes = calculateDuration(attendance.clockInTime, attendance.clockOutTime);

    await attendance.save();

    // Update Cumulative Hours in Profile
    const profile = await StudentProfile.findOne({ user: user._id });
    if (profile) {
        profile.totalAttendanceHours = (profile.totalAttendanceHours || 0) + (attendance.durationMinutes / 60);
        await profile.save();
    }

    return { success: true, message: `Clocked out. Duration: ${attendance.durationMinutes} mins.` };
};

const jwt = require('jsonwebtoken');

// In-memory store for active codes (Production: Use Redis)
// Map<code (string), timestamp (number)>
const activeCodes = new Map();

// Cleanup old codes every minute
setInterval(() => {
    const now = Date.now();
    for (const [code, ts] of activeCodes) {
        if (now - ts > 70000) activeCodes.delete(code);
    }
}, 60000);

// Generate a short-lived QR token + Manual Code
const generateQR = async (req, res) => {
    try {
        const token = jwt.sign({ type: 'attendance_qr', created: Date.now() }, process.env.JWT_SECRET, { expiresIn: '60s' });

        // Generate flexible 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        activeCodes.set(code, Date.now());

        res.json({ token, code });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// API: Clock In via QR Scan OR Manual Code
const handleQRScan = async (req, res) => {
    const { userId, qrToken, manualCode, start_or_end } = req.body;

    try {
        if (manualCode) {
            // Verify Manual Code
            const timestamp = activeCodes.get(manualCode);
            if (!timestamp) return res.status(400).json({ message: 'Invalid Code' });
            if (Date.now() - timestamp > 65000) { // 65s grace
                activeCodes.delete(manualCode);
                return res.status(400).json({ message: 'Code Expired' });
            }
        } else if (qrToken) {
            // Verify Token
            try {
                const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
                if (decoded.type !== 'attendance_qr') throw new Error('Invalid QR Type');
            } catch (err) {
                return res.status(400).json({ message: 'Invalid or Expired QR Code' });
            }
        } else {
            return res.status(400).json({ message: 'No credential provided' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let attendance = await Attendance.findOne({ user: userId, date: today });

        if (start_or_end === 'start') {
            if (attendance) return res.status(400).json({ message: 'Already clocked in' });

            attendance = new Attendance({
                user: userId,
                date: today,
                clockInTime: new Date(),
                method: manualCode ? 'Code' : 'QR',
                status: 'Present'
            });
            await attendance.save();
            return res.json({ message: 'Clock In Successful' });

        } else {
            if (!attendance) return res.status(400).json({ message: 'No Clock In record found' });
            if (attendance.clockOutTime) return res.status(400).json({ message: 'Already clocked out' });

            attendance.clockOutTime = new Date();
            attendance.durationMinutes = calculateDuration(attendance.clockInTime, attendance.clockOutTime);
            await attendance.save();

            // Update Total Hours
            const profile = await StudentProfile.findOne({ user: userId });
            if (profile) {
                profile.totalAttendanceHours = (profile.totalAttendanceHours || 0) + (attendance.durationMinutes / 60);
                await profile.save();
            }

            return res.json({ message: 'Clock Out Successful', duration: attendance.durationMinutes });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAttendanceHistory = async (req, res) => {
    try {
        const history = await Attendance.find({ user: req.params.userId }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getAllAttendance = async (req, res) => {
    try {
        const { date, userId } = req.query;
        let filter = {};

        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(queryDate);
            nextDay.setDate(nextDay.getDate() + 1);
            filter.date = { $gte: queryDate, $lt: nextDay };
        }

        if (userId) {
            filter.user = userId;
        }

        const records = await Attendance.find(filter)
            .populate('user', 'username email')
            .sort({ date: -1 })
            .limit(100); // hard limit for now

        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Placeholder for bot markAttendance if needed separately
const markAttendance = async (req, res) => {
    // Similar logic to handleDiscordLogin but via API
    res.json({ message: 'Not implemented via API yet, use Discord command' });
}

module.exports = {
    handleDiscordLogin,
    handleDiscordLogout,
    handleQRScan,
    getAttendanceHistory,
    getAllAttendance,
    markAttendance,
    generateQR
};
