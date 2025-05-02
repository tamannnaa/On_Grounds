const Mentor = require('../models/mentor');
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

module.exports = {
    getMentorAvailability,
    updateMentorAvailability,
    becomeMentor,
    getApplicationStatus
};