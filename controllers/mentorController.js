const Mentor = require('../models/mentor');
const { isValidObjectId } = require('mongoose');
const flash = require('connect-flash');
const getMentorAvailability = async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        res.json({ 
            success: true, 
            availability: {
                dates: mentor.availableDates || [],
                timeSlots: mentor.timeSlots || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMentorAvailability = async (req, res) => {
    try {
        const { dates, timeSlots } = req.body;
        if (!Array.isArray(dates)) {
            return res.status(400).json({ success: false, message: 'Dates must be an array' });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validDates = dates.every(date => dateRegex.test(date));
        if (!validDates) {
            return res.status(400).json({ success: false, message: 'Dates must be in YYYY-MM-DD format' });
        }

        const mentor = await Mentor.findById(req.params.mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        mentor.availableDates = dates;
        if (timeSlots) {
            mentor.timeSlots = timeSlots;
        }

        await mentor.save();
        res.json({ 
            success: true, 
            message: 'Availability updated successfully',
            availability: {
                dates: mentor.availableDates,
                timeSlots: mentor.timeSlots
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const becomeMentor = async (req, res) => {
    try {
        const languages = processLanguagesData(req.body.languages);
        const { hasLoan, loanDetails } = processLoanData(req.body);
        const documents = processDocumentUploads(req.files);

        const mentor = new Mentor({
            user: req.session.userId,
            name: req.body.name,
            about: req.body.about,
            countryOfBirth: req.body.countryOfBirth,
            currentCountry: req.body.currentCountry,
            currentCity: req.body.currentCity,
            status: req.body.status,
            collegeName: req.body.collegeName,
            workingField: req.body.workingField,
            languages: languages,
            price30: req.body.price30,
            price60: req.body.price60,
            timeSlots: req.body.timeSlots,
            days: req.body.days,
            documents: documents,
            hasLoan: hasLoan,
            loanDetails: loanDetails
        });
        await mentor.save();

        res.json({ 
            success: true, 
            message: 'Application submitted successfully',
            applicationStatus: 'PENDING'
        });
    } catch (error) {
        console.error('Error in mentor application:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error submitting application',
            error: error.message 
        });
    }
};
const processLanguagesData = (languageData) => {
    const languages = [];
    if (!languageData) return languages;
    
    if (Array.isArray(languageData)) {
        for (let i = 0; i < languageData.length; i++) {
            if (languageData[i].language && languageData[i].proficiency) {
                languages.push({
                    language: languageData[i].language,
                    proficiency: languageData[i].proficiency
                });
            }
        }
    }
    return languages;
};

const processLoanData = (requestBody) => {
    const hasLoan = requestBody.hasLoan === 'true';
    const loanDetails = hasLoan && requestBody.loanDetails ? {
        amount: requestBody.loanDetails.amount,
        purpose: requestBody.loanDetails.purpose
    } : undefined;
    
    return { hasLoan, loanDetails };
};

const processDocumentUploads = (files) => {
    const documents = {};
    if (!files) return documents;
    
    if (files.idProof) documents.idProof = files.idProof[0].filename;
    if (files.collegeId) documents.collegeId = files.collegeId[0].filename;
    if (files.addressProof) documents.addressProof = files.addressProof[0].filename;
    if (files.additionalDoc) documents.additionalDoc = files.additionalDoc[0].filename;
    
    return documents;
};

const getApplicationStatus = async (req, res) => {
    try {
        console.log('Fetching application status for user:', req.session.userId);
        const application = await Mentor.findOne({ user: req.session.userId });
        console.log('Found application:', application);
        
        if (!application) {
            return res.json({ status: null });
        }

        res.json({
            status: application.applicationStatus,
            rejectionReason: application.applicationStatus === 'REJECTED' ? application.rejectionReason : null,
            application: application
        });
    } catch (error) {
        console.error('Error fetching mentor application status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const addReview = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { content, rating } = req.body;
        const studentId = req.user._id; 
        
        if (!isValidObjectId(mentorId)) {
            return res.status(400).json({ success: false, message: 'Invalid mentor ID' });
        }
        
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ success: false, message: 'Review content is required' });
        }
        
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        
        const reviewData = {
            student: studentId,
            content,
            rating: ratingNum
        };
        
        await mentor.addReview(reviewData);
        
        return res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: {
                averageRating: mentor.ratings,
                totalReviews: mentor.reviews.length
            }
        });
        
    } catch (error) {
        console.error('Error adding review:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to add review',
            error: error.message 
        });
    }
};


const deleteReview = async (req, res) => {
    try {
        const { mentorId, reviewId } = req.params;
        const userId = req.user._id;
        const isAdmin = req.user.role === 'admin'; 
        
        const mentor = await Mentor.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        
        const reviewIndex = mentor.reviews.findIndex(review => 
            review._id.toString() === reviewId
        );
        
        if (reviewIndex === -1) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        
        const review = mentor.reviews[reviewIndex];
        if (!isAdmin && review.student.toString() !== userId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to delete this review' 
            });
        }
        
        mentor.reviews.splice(reviewIndex, 1);
        
        if (mentor.reviews.length > 0) {
            const totalRating = mentor.reviews.reduce((sum, r) => sum + r.rating, 0);
            mentor.ratings = parseFloat((totalRating / mentor.reviews.length).toFixed(1));
        } else {
            mentor.ratings = 0;
        }
        
        await mentor.save();
        
        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            data: {
                averageRating: mentor.ratings,
                totalReviews: mentor.reviews.length
            }
        });
        
    } catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to delete review',
            error: error.message 
        });
    }
};

const myProfile=async (req, res) => {
    try {
      const mentor = await Mentor.findOne({ user: req.user.id })
        .populate('user', 'email')
        .populate('reviews.student', 'name'); 
      
      if (!mentor) {
        return res.render('my-mentor-profile', { 
          mentor: null,
          message: 'Mentor profile not found' 
        });
      }
  
      res.render('my-mentor-profile', { 
        mentor,
        message: "success"
      });
    } catch (err) {
      console.error('Error fetching mentor profile:', err);
      res.status(500).render('error', { 
        message: 'Server error while fetching mentor profile'
      });
    }
  }

  const getEditProfilePage = async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ user: req.user._id });
        
        if (!mentor) {
            return res.status(500).json({ 
                success: false, 
                message: 'Mentor profile not found',
                error: error.message 
            });
            // req.flash('error', 'Mentor profile not found');
            // return res.redirect('/dashboard');
        }
        
        res.render('edit-profile', { 
            title: 'Edit Mentor Profile',
            mentor,
            user: req.user
        });
    } catch (err) {
        console.error('Error getting edit profile page:', err);
        req.flash('error', 'An error occurred while loading your profile');
        res.redirect('/dashboard');
    }
};

const updateProfile=async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ user: req.user._id });
        
        if (!mentor) {
            req.flash('error', 'Mentor profile not found');
            return res.redirect('/dashboard');
        }
        mentor.name = req.body.name;
        mentor.status = req.body.status;
        mentor.workingField = req.body.workingField;
        mentor.collegeName = req.body.collegeName;
        mentor.countryOfBirth = req.body.countryOfBirth;
        mentor.currentCountry = req.body.currentCountry;
        mentor.currentCity = req.body.currentCity;
        mentor.about = req.body.about;
        if (req.files.profilePhoto) {
            const profilePhoto = req.files.profilePhoto[0];
            if (mentor.profilePhoto) {
                const oldPhotoPath = path.join(__dirname, '../public', mentor.profilePhoto);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            mentor.profilePhoto = `/uploads/profile-photos/${profilePhoto.filename}`;
        }
        
        if (req.body.languages) {
            if (Array.isArray(req.body.languages)) {
                mentor.languages = req.body.languages;
            } 
            else if (typeof req.body.languages === 'object') {
                mentor.languages = [req.body.languages];
            }
        } else {
            mentor.languages = [];
        }
        
        mentor.price30 = req.body.price30 || 0;
        mentor.price60 = req.body.price60 || 0;
        
        mentor.days = Array.isArray(req.body.days) ? req.body.days : (req.body.days ? [req.body.days] : []);
        
        mentor.availableDates = Array.isArray(req.body.availableDates) 
            ? req.body.availableDates 
            : (req.body.availableDates ? [req.body.availableDates] : []);
        
        if (req.body.timeSlots) {
            if (Array.isArray(req.body.timeSlots)) {
                mentor.timeSlots = req.body.timeSlots;
            } 
            else if (typeof req.body.timeSlots === 'object') {
                mentor.timeSlots = [req.body.timeSlots];
            }
        } else {
            mentor.timeSlots = [];
        }
        
        if (!mentor.documents) {
            mentor.documents = {};
        }
        
        const documentTypes = ['idProof', 'collegeId', 'addressProof', 'additionalDoc'];
        for (const docType of documentTypes) {
            if (req.files[docType]) {
                const document = req.files[docType][0];
                if (mentor.documents[docType]) {
                    const oldDocPath = path.join(__dirname, '../public', mentor.documents[docType]);
                    if (fs.existsSync(oldDocPath)) {
                        fs.unlinkSync(oldDocPath);
                    }
                }
                
                mentor.documents[docType] = `/uploads/${req.user._id}/${document.filename}`;
            }
        }
        
        mentor.hasLoan = req.body.hasLoan === 'on';
        if (mentor.hasLoan && req.body.loanDetails) {
            mentor.loanDetails = {
                amount: req.body.loanDetails.amount || 0,
                purpose: req.body.loanDetails.purpose || ''
            };
        } else {
            mentor.loanDetails = { amount: 0, purpose: '' };
        }
        
        await mentor.save();
        
        req.flash('success', 'Profile updated successfully');
        res.redirect('/mentor/my-profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        req.flash('error', 'An error occurred while updating your profile');
        res.redirect('/mentor/edit-profile');
    }
};

module.exports = {
    getMentorAvailability,
    updateMentorAvailability,
    becomeMentor,
    getApplicationStatus,
    addReview,
    deleteReview,
    myProfile,
    getEditProfilePage,
    updateProfile
};