const express = require('express');
const router = express.Router();
const {getLoginPage,login,logout,getDashboard,getTutorApplications,getDashboardStats,getMentorApplications,
    getBookings,updateApplicationStatus} = require('../controllers/adminController');
const { isAdmin } = require('../middleware/adminMiddleware');

router.get('/login', getLoginPage);
router.post('/login', login);
router.get('/logout', logout);

router.get('/dashboard', isAdmin, getDashboard);
router.get('/tutor-applications', isAdmin, getTutorApplications);

router.get('/api/dashboard-stats', isAdmin, getDashboardStats);
router.get('/api/mentor-applications', isAdmin, getMentorApplications);
router.get('/api/bookings', isAdmin, getBookings);
router.post('/api/update-application-status', isAdmin,updateApplicationStatus);

module.exports = router;