
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const authController = require('../controllers/authController');
const bcrypt = require('bcryptjs');

// Discord OAuth
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        const token = jwt.sign({ id: req.user._id, roles: req.user.roles }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.redirect(`http://localhost:5173/login?token=${token}`);
    }
);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication API
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authController.me);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid Credentials
 */
router.post('/login', authController.login);

// Helper endpoint for setup - protected by secret key check or removal in prod
router.post('/create-super-admin', async (req, res) => {
    const { username, email, password, secretKey } = req.body;
    if (secretKey !== process.env.JWT_SECRET) return res.status(403).json({ message: 'Forbidden' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            email,
            password: hashedPassword,
            discordId: `admin_${Date.now()}`,
            isSuperAdmin: true
        });

        await user.save();
        res.status(201).json({ message: 'Super Admin Created' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
