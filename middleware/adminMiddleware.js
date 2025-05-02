
const Admin = require('../models/admin');

const isAdmin = async (req, res, next) => {
    try {
        if (!req.session.adminId || !req.session.isAdmin) {
            return res.redirect('/admin/login');
        }
        const admin = await Admin.findById(req.session.adminId);

        if (!admin) {
            req.session.destroy(err => {
                if (err) console.error('Session destruction error:', err);
            });
            return res.redirect('/admin/login');
        }

        if (admin.email !== 'vanshn122@gmail.com') {
            req.session.destroy(err => {
                if (err) console.error('Session destruction error:', err);
            });
            return res.redirect('/admin/login');
        }
        req.admin = admin;
        next();
    } catch (error) {
        console.error('❌ Admin middleware error:', error);
        res.redirect('/admin/login');
    }
};

const requestLogger = (req, res, next) => {
    console.log('\n=== Incoming Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('Body:', req.body);
    console.log('Session:', req.session);
    console.log('=== End Request Info ===\n');
    next();
};

module.exports = {
    isAdmin,
    requestLogger
};