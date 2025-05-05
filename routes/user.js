const express = require('express');
const router = express.Router();
const {getMentorAvailability,updateMentorAvailability,getTutorProfile,bookSlot,searchTutors,
    getHomePage,getDashboard,getBecomeMentorPage
} = require('../controllers/userController');
const {logRequests,errorHandler}= require('../middleware/userMiddleware');
const {getSignupPage,signup,getLoginPage,login,getVerifyPage,verifyOTP,logout,getSessionStatus,registerMentor} = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/signup', getSignupPage);
router.post('/signup', signup);
router.get('/login', getLoginPage);
router.post('/login',login);
router.get('/verify', getVerifyPage);
router.post('/verify', verifyOTP);
router.get('/logout', logout);
router.get('/api/session-status',getSessionStatus);
// Basic user routes
router.get('/', getHomePage);
router.get('/dashboard', isAuthenticated,getDashboard);
router.get('/become-mentor', isAuthenticated,getBecomeMentorPage);
router.post('/search-tutors', searchTutors);
router.post('/api/mentor/register', isAuthenticated,registerMentor);

router.use(logRequests);
router.use(errorHandler);
router.get('/availability/:mentorId', getMentorAvailability);
router.post('/availability/:mentorId', updateMentorAvailability);
router.get('/:id', getTutorProfile);
router.post('/:id/book', bookSlot);





module.exports = router;

module.exports = router;