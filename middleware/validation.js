const mongoose = require('mongoose');
const User = require('../models/user');

const checkDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.error('Database connection is not ready');
        return res.status(500).json({ error: 'Database connection error' });
    }
    next();
};

const validateSession = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            console.error('No valid session found');
            return res.status(401).json({ error: 'Please login again' });
        }
        const user = await User.findById(req.session.userId);
        if (!user) {
            console.error('User not found in database:', req.session.userId);
            return res.status(401).json({ error: 'User not found' });
        }

        req.currentUser = user;
        next();
    } catch (error) {
        console.error('Session validation error:', error);
        res.status(500).json({ error: 'Session validation failed' });
    }
};
module.exports={
    checkDbConnection,
    validateSession
}