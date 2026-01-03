
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password').populate('roles');
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { id: user._id, roles: user.roles, isSuperAdmin: user.isSuperAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Hide password in response
        user.password = undefined;
        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.me = async (req, res) => {
    try {
        // verifyToken middleware attaches user to req.user (conceptually, but let's check middleware)
        // If using passport or manual middleware, req.user or req.headers check is needed.
        // In authRoutes /me, we see it was just: router.get('/me', authController.me);
        // But authRoutes does NOT use router.use(verifyToken) globally.
        // However, the /me route in the Swagger definition implies it uses Bearer auth.
        // Let's manually verify token here to be safe if middleware isn't forced on this route yet.

        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).populate('roles');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
