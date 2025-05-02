const Admin = require('../models/admin');
const User = require('../models/user');
const Mentor = require('../models/mentor');
const Booking = require('../models/booking');
const { sendOTPEmail } = require('../utils/emailService');

const getLoginPage = (req, res) => {
    res.render('admin-login', { layout: false });
};


const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const admin = await Admin.findOne({ username, email });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.adminId = admin._id;
        req.session.isAdmin = true;
        req.session.username = admin.username;

        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, redirect: '/admin/dashboard' });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
};

const getDashboard = async (req, res) => {
    try {
        const [totalUsers, totalMentors, pendingApplications] = await Promise.all([
            User.countDocuments().catch(() => 0),
            Mentor.countDocuments({ applicationStatus: 'APPROVED' }).catch(() => 0),
            Mentor.countDocuments({ applicationStatus: 'PENDING' }).catch(() => 0)
        ]);

        res.render('admin-dashboard', { 
            totalUsers,
            totalMentors,
            pendingApplications,
            layout: false 
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.render('admin-dashboard', { 
            totalUsers: 0,
            totalMentors: 0,
            pendingApplications: 0,
            layout: false,
            error: 'Failed to load initial data'
        });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        console.log('Fetching dashboard stats...');
        console.log('Session:', req.session);
        const [
            totalUsers,
            totalMentors,
            pendingApplications,
            todayBookings,
            applicationStats,
            weeklyBookingsData
        ] = await Promise.all([
            User.countDocuments().catch(err => {
                console.error('Error counting users:', err);
                return 0;
            }),
            Mentor.countDocuments({ applicationStatus: 'APPROVED' }).catch(err => {
                console.error('Error counting active mentors:', err);
                return 0;
            }),
            Mentor.countDocuments({ applicationStatus: 'PENDING' }).catch(err => {
                console.error('Error counting pending applications:', err);
                return 0;
            }),
            (async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return await Booking.countDocuments({
                    date: { $gte: today }
                }).catch(err => {
                    console.error('Error counting today\'s bookings:', err);
                    return 0;
                });
            })(),
            (async () => {
                try {
                    const [pending, approved, rejected] = await Promise.all([
                        Mentor.countDocuments({ applicationStatus: 'PENDING' }),
                        Mentor.countDocuments({ applicationStatus: 'APPROVED' }),
                        Mentor.countDocuments({ applicationStatus: 'REJECTED' })
                    ]);
                    return { pending, approved, rejected };
                } catch (err) {
                    console.error('Error getting application stats:', err);
                    return { pending: 0, approved: 0, rejected: 0 };
                }
            })(),
            (async () => {
                try {
                    const labels = [];
                    const data = [];
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        date.setHours(0, 0, 0, 0);
                        const nextDate = new Date(date);
                        nextDate.setDate(date.getDate() + 1);
                        const count = await Booking.countDocuments({
                            date: { $gte: date, $lt: nextDate }
                        });
                        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                        data.push(count);
                    }
                    return { labels, data };
                } catch (err) {
                    console.error('Error getting weekly bookings:', err);
                    return {
                        labels: Array(7).fill('').map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - i));
                            return date.toLocaleDateString('en-US', { weekday: 'short' });
                        }),
                        data: Array(7).fill(0)
                    };
                }
            })()
        ]);

        console.log('Dashboard stats fetched successfully');
        
        res.json({
            totalUsers,
            totalMentors,
            pendingApplications,
            todayBookings,
            applicationStats,
            weeklyBookings: weeklyBookingsData
        });
    } catch (error) {
        console.error('Error in dashboard stats API:', error);
        res.status(500).json({
            error: 'Failed to fetch dashboard statistics',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getMentorApplications = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.applicationStatus = status.toUpperCase();
        }

        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }

        console.log('Fetching applications with query:', query);
        const applications = await Mentor.find(query)
            .populate('user', 'email')
            .sort('-createdAt');
        
        console.log('Found applications:', applications.length);
        
        // Transform the data to include email from userId
        const transformedApplications = applications.map(app => {
            const appObj = app.toObject();
            return {
                ...appObj,
                email: appObj.user ? appObj.user.email : 'N/A'
            };
        });

        console.log('Sending transformed applications data');
        res.json({ applications: transformedApplications });
    } catch (error) {
        console.error('Error fetching mentor applications:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getBookings = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status.toUpperCase();
        }

        const bookings = await Booking.find(query)
            .populate('mentorId', 'name')
            .populate('studentId', 'username')
            .sort('-createdAt');

        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            mentorName: booking.mentorId.name,
            studentName: booking.studentId.username,
            date: booking.date,
            timeSlot: booking.timeSlot,
            duration: booking.duration,
            status: booking.status
        }));

        res.json({ bookings: formattedBookings });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId, status, rejectionReason } = req.body;
        console.log('Updating application status:', { applicationId, status, rejectionReason });

        const application = await Mentor.findById(applicationId).populate('user');
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        application.applicationStatus = status;
        if (status === 'REJECTED' && rejectionReason) {
            application.rejectionReason = rejectionReason;
        }

        await application.save();
        console.log('Application updated successfully:', application);

        const emailSubject = status === 'APPROVED' 
            ? 'Your Mentor Application has been Approved!' 
            : 'Update on Your Mentor Application';

        const emailText = status === 'APPROVED'
            ? `Congratulations! Your application to become a mentor has been approved. You can now start accepting students.`
            : `Your mentor application status has been updated to ${status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;

        if (application.user&& application.user.email) {
            await sendOTPEmail(application.user.email, emailText);
            console.log('Notification email sent to:', application.user.email);
        }

        res.json({ success: true, application });
    } catch (error) {
        console.error('Error updating application status:', error);
        res.status(500).json({ error: 'Failed to update application status' });
    }
};

const getTutorApplications = async (req, res) => {
    try {
        console.log('Fetching tutor applications...');
        const applications = await Mentor.find().populate('user');
        console.log(`Found ${applications.length} applications`);

        res.render('tutor-applications', {
            applications: applications,
            user: req.admin
        });
    } catch (error) {
        console.error('Error fetching tutor applications:', error);
        res.status(500).render('error', { 
            message: 'Error loading tutor applications',
            error: error
        });
    }
};
module.exports={
    getLoginPage,
    login,
    logout,
    getDashboard,
    getDashboardStats,
    getMentorApplications,
    getBookings,
    updateApplicationStatus,
    getTutorApplications
}