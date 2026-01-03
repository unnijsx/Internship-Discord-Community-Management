
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: 'Access Denied: Malformed Token' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // Map decoded 'id' to '_id' for compatibility with Mongoose-style user objects
        req.user = { _id: verified.id, ...verified };
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

module.exports = verifyToken;
