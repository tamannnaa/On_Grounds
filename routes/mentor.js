const express = require('express');
const router = express.Router();
const {getMentorAvailability,updateMentorAvailability,getApplicationStatus,becomeMentor,
    addReview,getMentorReviews,deleteReview,
    myProfile,getEditProfilePage,updateProfile
} = require('../controllers/mentorController');
const{ documentUpload } = require('../middleware/uploadMiddleware');
const {isAuthenticated, isMentor}=require('../middleware/auth');

router.get('/availability/:mentorId',getMentorAvailability);
router.post('/availability/:mentorId',updateMentorAvailability);
router.get('/api/mentor/application-status', isAuthenticated, getApplicationStatus);
router.post('/become-mentor',documentUpload, becomeMentor);

router.post('/:mentorId/reviews', isAuthenticated, addReview);
router.get('/:mentorId/reviews', getMentorReviews); // Public route
router.delete('/mentors/:mentorId/reviews/:reviewId', isAuthenticated, deleteReview);

router.get('/my-profile', isAuthenticated,myProfile);
router.get('/edit-profile', isAuthenticated, isMentor, getEditProfilePage);
router.post('/update-profile', isAuthenticated,isMentor,documentUpload,updateProfile);

module.exports = router;