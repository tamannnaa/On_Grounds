const User = require('../models/user');
const Mentor=require('../models/mentor');
const isAuthenticated = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please login to continue' 
            });
        }
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).send('Server error');
    }
};
const isMentor =async function(req, res, next) {
    const mentor = await Mentor.findOne({ user: req.user._id });
    if (mentor) {
        return next();
    }
    else{
        res.redirect('/dashboard');
    }
    
};
module.exports = {
    isAuthenticated,
    isMentor
}; 