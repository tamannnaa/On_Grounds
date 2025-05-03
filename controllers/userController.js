const Mentor = require('../models/mentor');
const Booking = require('../models/booking');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const { sendOTPEmail } = require('../utils/emailService');
const { documentUpload } = require('../middleware/uploadMiddleware');
const getMentorAvailability = async (req, res) => {
    try {
        const mentor = await Mentor.findById(req.params.mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }
        const days = mentor.days || [];
        res.json({ 
            success: true, 
            availability: {
                dates: mentor.availableDates || [],
                timeSlots: mentor.timeSlots || [],
                days: days
            }
        });
    } catch (error) {
        console.error('Error fetching mentor availability:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateMentorAvailability = async (req, res) => {
    try {
        const { dates, timeSlots, days, duration } = req.body;
        if (!Array.isArray(dates)) {
            return res.status(400).json({ success: false, message: 'Dates must be an array' });
        }
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validDates = dates.every(date => dateRegex.test(date));
        if (!validDates) {
            return res.status(400).json({ success: false, message: 'Dates must be in YYYY-MM-DD format' });
        }
        if (timeSlots && !Array.isArray(timeSlots)) {
            return res.status(400).json({ success: false, message: 'Time slots must be an array' });
        }
        if (duration && ![30, 60].includes(duration)) {
            return res.status(400).json({ success: false, message: 'Duration must be either 30 or 60 minutes' });
        }

        const mentor = await Mentor.findById(req.params.mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        mentor.availableDates = dates;
        if (timeSlots) {
            mentor.timeSlots = timeSlots.map(slot => ({
                time: slot,
                duration: duration || 60 
            }));
        }
        
        if (days) {
            mentor.days = days;
        }

        await mentor.save();
        res.json({ 
            success: true, 
            message: 'Availability updated successfully',
            availability: {
                dates: mentor.availableDates,
                timeSlots: mentor.timeSlots,
                days: mentor.days
            }
        });
    } catch (error) {
        console.error('Error updating mentor availability:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTutorProfile = async (req, res) => {
    try {
        // Populate both the user field and the reviews field
        const tutor = await Mentor.findById(req.params.id)
            .populate('user')
            .populate({
                path: 'reviews.student', 
                select: 'username '  // Populate the user who left the review (assuming reviews have userId field)
            }).sort({ createdAt: -1 });;
            
        if (!tutor) {
            return res.status(404).render('error', { message: 'Tutor not found' });
        }
        
        const bookings = await Booking.find({ tutorId: tutor._id });
        const bookedSlots = bookings.map(booking => ({
            date: booking.date,
            timeSlot: booking.timeSlot
        }));

        // Use the reviews field from the tutor document
        // Sort reviews by date if needed
        const reviews = tutor.reviews ? tutor.reviews.sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
        
        res.render('tutor-profile', {
            tutor,
            bookedSlots,
            reviews
        });
    } catch (error) {
        console.error('Error fetching tutor profile:', error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};

const bookSlot = async (req, res) => {
    try {
        const { date, timeSlot } = req.body;
        const tutorId = req.params.id;
        const userId = req.session.userId; 

        if (!userId) {
            return res.status(401).json({ error: 'Please login to book a session' });
        }
        const existingBooking = await Booking.findOne({
            tutorId,
            date,
            timeSlot
        });

        if (existingBooking) {
            return res.status(400).json({ error: 'This slot is already booked' });
        }
        const booking = new Booking({
            tutorId,
            userId,
            date,
            timeSlot,
            status: 'PENDING'
        });

        await booking.save();

        res.status(201).json({
            message: 'Booking successful',
            booking: {
                date,
                timeSlot,
                status: 'PENDING'
            }
        });
    } catch (error) {
        console.error('Error booking slot:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const searchTutors = async (req, res) => {
    try {
        console.log('Search parameters:', req.query);
        const { location, minPrice, maxPrice, hasLoan } = req.query;
        let query = { applicationStatus: 'APPROVED' };
        let user = null;
        if (req.session.userId) {
            user = await User.findById(req.session.userId);
        }
        if (location) {
            const locationTerms = location.split(',').map(term => term.trim());
            const locationRegexes = locationTerms.map(term => new RegExp(term, 'i'));
            
            query.$or = [
                { currentCountry: { $in: locationRegexes } },
                { currentCity: { $in: locationRegexes } }
            ];
        }
        if (hasLoan !== undefined) {
            query.hasLoan = hasLoan === 'true';
        }
        let tutors = await Mentor.find(query);
        tutors = tutors.map(tutor => {
            const tutorObj = tutor.toObject();
            const match = calculateMatchPercentage(tutorObj, {
                location,
                minPrice: minPrice ? parseFloat(minPrice) : null,
                maxPrice: maxPrice ? parseFloat(maxPrice) : null,
                hasLoan: hasLoan === 'true'
            });
            
            return {
                ...tutorObj,
                matchPercentage: match.percentage,
                matchingCriteria: match.matchingCriteria
            };
        });
        tutors.sort((a, b) => b.matchPercentage - a.matchPercentage);
        const mentor = await Mentor.findOne({ user: req.session.userId });
        const isMentor = !!mentor; 
        res.render('search-results', {
            tutors,
            user,
            isMentor,
            userId: req.session.userId
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', {
            message: 'An error occurred while searching for tutors',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: null,
            userId: req.session.userId
        });
    }
};

const calculateMatchPercentage = (tutor, criteria) => {
    let matchPoints = 0;
    let totalPoints = 0;
    let matchingCriteria = [];

    if (criteria.location) {
        totalPoints += 2; 
        const [searchCity, searchCountry] = criteria.location.split(',').map(part => part.trim().toLowerCase());
        
        if (searchCountry) {
            if (tutor.currentCountry.toLowerCase() === searchCountry) {
                matchPoints += 1;
                matchingCriteria.push('Country Match');
            }
            if (searchCity && tutor.currentCity.toLowerCase() === searchCity) {
                matchPoints += 1;
                matchingCriteria.push('City Match');
            }
        } else {
            const searchTerm = criteria.location.toLowerCase();
            if (tutor.currentCountry.toLowerCase().includes(searchTerm) ||
                tutor.currentCity.toLowerCase().includes(searchTerm)) {
                matchPoints += 1;
                matchingCriteria.push('Location Match');
            }
        }
    }

    if (criteria.minPrice || criteria.maxPrice) {
        totalPoints += 1;
        const tutorMinPrice = Math.min(tutor.price30 / 30 * 60, tutor.price60);
        
        if ((!criteria.minPrice || tutorMinPrice >= criteria.minPrice) &&
            (!criteria.maxPrice || tutorMinPrice <= criteria.maxPrice)) {
            matchPoints += 1;
            matchingCriteria.push('Price Match');
        }
    }

    if (criteria.hasLoan !== undefined) {
        totalPoints += 1;
        if (tutor.hasLoan === criteria.hasLoan) {
            matchPoints += 1;
            matchingCriteria.push('Loan Status Match');
        }
    }

    const percentage = totalPoints > 0 ? Math.round((matchPoints / totalPoints) * 100) : 100;
    
    return {
        percentage,
        matchingCriteria
    };
};

const getSignupPage = (req, res) => {
    res.render('signup', { layout: false });
};

const getLoginPage = (req, res) => {
    res.render('login', { layout: false });
};

const getVerifyPage = (req, res) => {
    res.render('verify', { layout: false });
};

const signup = async (req, res) => {
    console.log('Received signup request with body:', req.body);
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60000);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            otp,
            otpExpiry
        });
        await user.save();
        try {
            await sendOTPEmail(email, otp);
        } catch (emailError) {
            await User.deleteOne({ _id: user._id });
            console.error('Email sending failed, user deleted:', emailError);
            return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
        }

        req.session.email = email;
        
        res.json({ success: true, redirect: '/verify' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

const verifyOTP = async (req, res) => {
    
    try {
        const { otp } = req.body;
        const email = req.session.email;

        const user = await User.findOne({ 
            email,
            otp,
            otpExpiry: { $gt: new Date() }
        });

        if (!user) {
            console.log('Sending error response - Invalid or expired OTP');
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        req.session.userId = user._id;

        const response = { success: true, redirect: '/login' };
        res.json(response);
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        req.session.userId = user._id;
        res.json({ success: true, redirect: '/dashboard' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

const logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};

const getSessionStatus = (req, res) => {
    res.json({
        isAuthenticated: !!req.session.userId,
        userId: req.session.userId
    });
};

const getHomePage = (req, res) => {
    res.render('home', { layout: false });
};

const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        
        const mentor = await Mentor.findOne({ user: req.session.userId });
        const isMentor = !!mentor; 
        
        res.render('dashboard', { user, isMentor, layout: false });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.redirect('/login');
    }
};

const getBecomeMentorPage = (req, res) => {
    res.render('become-mentor', { layout: false });
};

const registerMentor = async (req, res) => {
    try {
        documentUpload(req, res, async function(err) {
            if (err) {
                console.error('File upload error:', err);
                return res.status(400).json({ 
                    success: false,
                    error: err.message || 'Error uploading files'
                });
            }

            try {
                const existingApplication = await Mentor.findOne({ user: req.session.userId });
                if (existingApplication && existingApplication.applicationStatus !== 'REJECTED') {
                    return res.status(400).json({ 
                        success: false,
                        error: 'You already have a pending or approved application'
                    });
                }
                let languagesData = [];
                try {
                    if (req.body.languages) {
                        languagesData = typeof req.body.languages === 'string' 
                            ? JSON.parse(req.body.languages)
                            : req.body.languages;
                            
                        languagesData = languagesData.filter(lang => 
                            lang && 
                            typeof lang === 'object' && 
                            lang.language && 
                            lang.proficiency && 
                            ['Native', 'Advanced', 'Intermediate', 'Beginner'].includes(lang.proficiency)
                        );
                    }
                } catch (error) {
                    console.error('Error processing languages data:', error);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid languages data format: ' + error.message
                    });
                }

                let parsedTimeSlots = [];
                try {
                    if (req.body.timeSlots) {
                        parsedTimeSlots = typeof req.body.timeSlots === 'string'
                            ? JSON.parse(req.body.timeSlots)
                            : req.body.timeSlots;
                        if (!Array.isArray(parsedTimeSlots)) {
                            throw new Error('Time slots must be an array');
                        }
                        parsedTimeSlots = parsedTimeSlots.filter(slot => 
                            slot && 
                            typeof slot === 'object' && 
                            slot.time && 
                            (slot.duration === 30 || slot.duration === 60)
                        );
                    }
                } catch (error) {
                    console.error('Error processing time slots:', error);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid time slots format: ' + error.message
                    });
                }
                let parsedDays = [];
                try {
                    if (req.body.days) {
                        parsedDays = typeof req.body.days === 'string'
                            ? JSON.parse(req.body.days)
                            : req.body.days;
                        if (!Array.isArray(parsedDays)) {
                            throw new Error('Days must be an array');
                        }
                        const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                        parsedDays = parsedDays.filter(day => validDays.includes(day));
                    }
                } catch (error) {
                    console.error('Error processing days:', error);
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid days format: ' + error.message
                    });
                }

                const {
                    name,
                    about,
                    countryOfBirth,
                    currentCountry,
                    currentCity,
                    status,
                    collegeName,
                    workingField,
                    price30,
                    price60,
                    hasLoan
                } = req.body;

                if (!name || !about || !countryOfBirth || !currentCountry || !currentCity || !status) {
                    return res.status(400).json({
                        success: false,
                        error: 'Please fill in all required fields'
                    });
                }
                if (price30 === undefined || price60 === undefined) {
                    return res.status(400).json({
                        success: false,
                        error: 'Price for 30 and 60 minute sessions are required'
                    });
                }
                const mentorData = {
                    user: req.session.userId,
                    name,
                    about,
                    countryOfBirth,
                    currentCountry,
                    currentCity,
                    status,
                    collegeName: status === 'student' ? collegeName : undefined,
                    workingField: status === 'professional' ? workingField : undefined,
                    price30: parseFloat(price30),
                    price60: parseFloat(price60),
                    timeSlots: parsedTimeSlots,
                    days: parsedDays,
                    languages: languagesData,
                    hasLoan: hasLoan === 'true',
                    applicationStatus: 'PENDING'
                };
                if (req.body.availableDates) {
                    try {
                        const availableDates = typeof req.body.availableDates === 'string'
                            ? JSON.parse(req.body.availableDates)
                            : req.body.availableDates;
                        
                        if (Array.isArray(availableDates)) {
                            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                            mentorData.availableDates = availableDates.filter(date => 
                                typeof date === 'string' && dateRegex.test(date)
                            );
                        }
                    } catch (error) {
                        console.error('Error processing available dates:', error);
                    }
                }
                if (hasLoan === 'true' && req.body.loanDetails) {
                    try {
                        const loanDetails = typeof req.body.loanDetails === 'string'
                            ? JSON.parse(req.body.loanDetails)
                            : req.body.loanDetails;

                        if (loanDetails && typeof loanDetails === 'object') {
                            mentorData.loanDetails = {
                                amount: parseFloat(loanDetails.amount) || 0,
                                purpose: loanDetails.purpose || ''
                            };
                        }
                    } catch (error) {
                        console.error('Error processing loan details:', error);
                    }
                }
                if (req.files) {
                    mentorData.documents = {
                        idProof: req.files.idProof ? `/uploads/documents/${path.basename(req.files.idProof[0].path)}` : null,
                        collegeId: req.files.collegeId ? `/uploads/documents/${path.basename(req.files.collegeId[0].path)}` : null,
                        addressProof: req.files.addressProof ? `/uploads/documents/${path.basename(req.files.addressProof[0].path)}` : null,
                        additionalDoc: req.files.additionalDoc ? `/uploads/documents/${path.basename(req.files.additionalDoc[0].path)}` : null
                    };
                    mentorData.profilePhoto = req.files.profilePhoto ? `/uploads/profile-photos/${path.basename(req.files.profilePhoto[0].path)}` : null;
                }

                let savedApplication;
                if (existingApplication) {
                    savedApplication = await Mentor.findByIdAndUpdate(
                        existingApplication._id, 
                        { ...mentorData, user: existingApplication.user },
                        { new: true }
                    );
                } else {
                    savedApplication = await new Mentor(mentorData).save();

                    // Update the user to link them to their mentor profile
                    // Note: User schema doesn't have isMentor or mentorId fields in the provided schema
                    // This functionality would need to be added to the User schema if needed
                }

                res.status(200).json({ 
                    success: true, 
                    message: 'Application submitted successfully',
                    application: savedApplication
                });
            } catch (innerError) {
                console.error('Error processing mentor registration:', innerError);
                return res.status(500).json({ 
                    success: false,
                    error: 'Failed to process application: ' + (innerError.message || 'Unknown error')
                });
            }
        });
    } catch (outerError) {
        console.error('Mentor registration error:', outerError);
        res.status(500).json({ 
            success: false,
            error: 'Failed to submit application: ' + (outerError.message || 'Unknown error')
        });
    }
};

module.exports = {
    getMentorAvailability,
    updateMentorAvailability,
    getTutorProfile,
    bookSlot,
    searchTutors,
    getSignupPage,
    getLoginPage,
    getVerifyPage,
    signup,
    verifyOTP,
    login,
    logout,
    getSessionStatus,
    getHomePage,
    getDashboard,
    getBecomeMentorPage,
    registerMentor
};