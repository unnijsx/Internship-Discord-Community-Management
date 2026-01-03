
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

// API: QR Code Scan (Student scans Admin's QR)
// Logic: Admin generates a token (session ID) encoded in QR. Student scans it.
// POST /api/attendance/scan
const handleQRScan = async (req, res) => {
    const { userId, qrToken, start_or_end } = req.body; // start_or_end = 'start' or 'end'

    // In a real app, verify qrToken is valid/active for the current session
    // For now, assuming static QR for "Campus Location"

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let attendance = await Attendance.findOne({ user: userId, date: today });

        if (start_or_end === 'start') {
            if (attendance) return res.status(400).json({ message: 'Already clocked in' });

            attendance = new Attendance({
                user: userId,
                date: today,
                clockInTime: new Date(),
                method: 'QR',
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
    markAttendance
};
