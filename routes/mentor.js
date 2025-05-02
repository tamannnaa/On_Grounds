const express = require('express');
const router = express.Router();
const {getMentorAvailability,updateMentorAvailability,registerMentor,getApplicationStatus,becomeMentor} = require('../controllers/mentorController');
const{ documentUpload } = require('../middleware/uploadMiddleware');
const {isAuthenticated}=require('../middleware/auth');

router.get('/availability/:mentorId',getMentorAvailability);
router.post('/availability/:mentorId',updateMentorAvailability);
router.get('/api/mentor/application-status', isAuthenticated, getApplicationStatus);
router.post('/become-mentor',documentUpload, becomeMentor);

module.exports = router;