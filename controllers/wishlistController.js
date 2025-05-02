const User = require('../models/user');
const Mentor = require('../models/mentor');

async function getUserWithWishlist(userId, populateOptions = {}) {
    return await User.findById(userId)
        .populate({
            path: 'wishlist.tutorId',
            model: 'Mentor',
            select: populateOptions.select || ''
        });
}
const testWishlist = (req, res) => {
    res.json({ message: 'Wishlist system is working' });
};

const toggleWishlistItem = async (req, res) => {
    try {
        const { tutorId } = req.body;
        
        if (!tutorId) {
            return res.status(400).json({
                success: false,
                message: 'Tutor ID is required'
            });
        }

        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.wishlist) {
            user.wishlist = [];
        }
        const existingIndex = user.wishlist.findIndex(item => 
            item.tutorId && item.tutorId.toString() === tutorId.toString()
        );

        const isAdding = existingIndex === -1;
        
        if (isAdding) {
            user.wishlist.push({
                tutorId: tutorId,
                addedAt: new Date()
            });
        } else {
            user.wishlist.splice(existingIndex, 1);
        }

        await user.save();

        res.json({
            success: true,
            message: isAdding ? 'Added to wishlist' : 'Removed from wishlist',
            isWishlisted: isAdding
        });
    } catch (error) {
        console.error('Wishlist toggle error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating wishlist',
            error: error.message
        });
    }
};
const getWishlistItems = async (req, res) => {
    try {
        const user = await getUserWithWishlist(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            wishlist: user.wishlist
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching wishlist'
        });
    }
};

const checkWishlistStatus = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isWishlisted = user.wishlist?.some(item => 
            item.tutorId.toString() === tutorId
        );

        res.json({
            success: true,
            isWishlisted
        });
    } catch (error) {
        console.error('Error checking wishlist status:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking wishlist status'
        });
    }
};
const getWishlistPage = async (req, res) => {
    try {
        const user = await getUserWithWishlist(req.session.userId, {
            select: 'name username profilePhoto currentCity currentCountry collegeName about price30 price60 subjects languages applicationStatus hasLoan'
        });
        
        if (!user) {
            return res.redirect('/login');
        }
        const wishlistItems = user.wishlist
            .filter(item => item.tutorId)
            .map(item => {
                const tutor = item.tutorId;
                if (!tutor) {
                    return null;
                }

                return {
                    _id: tutor._id,
                    name: tutor.name || tutor.username || 'Unnamed Tutor',
                    username: tutor.username,
                    profilePhoto: tutor.profilePhoto,
                    currentCity: tutor.currentCity || 'City not specified',
                    currentCountry: tutor.currentCountry || 'Country not specified',
                    collegeName: tutor.collegeName || 'College not specified',
                    about: tutor.about || 'No description available',
                    price30: tutor.price30 || 0,
                    price60: tutor.price60 || 0,
                    languages: tutor.languages || [],
                    applicationStatus: tutor.applicationStatus,
                    hasLoan: tutor.hasLoan,
                    rating: 4.0,
                    reviewCount: 0,
                    activeStudents: 0, 
                    totalLessons: 0, 
                    addedAt: item.addedAt,
                    isWishlisted: true
                };
            })
            .filter(Boolean); 

        wishlistItems.sort((a, b) => b.addedAt - a.addedAt);

        res.render('wishlist', {
            user: user,
            wishlistItems: wishlistItems,
            userId: req.session.userId
        });
    } catch (error) {
        console.error('Error in wishlist route:', error);
        res.status(500).render('error', {
            message: 'Error loading wishlist',
            error: error,
            user: null
        });
    }
};

const addToWishlist = async (req, res) => {
    try {
        const tutorId = req.params.tutorId;
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const existingItem = user.wishlist.find(item => 
            item.tutorId.toString() === tutorId
        );

        if (existingItem) {
            return res.status(400).json({
                success: false,
                message: 'Tutor already in wishlist'
            });
        }
        user.wishlist.push({
            tutorId: tutorId,
            addedAt: new Date()
        });

        await user.save();

        res.json({
            success: true,
            message: 'Added to wishlist successfully'
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding to wishlist'
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const tutorId = req.params.tutorId;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        user.wishlist = user.wishlist.filter(item => 
            item.tutorId.toString() !== tutorId
        );

        await user.save();

        res.json({
            success: true,
            message: 'Removed from wishlist successfully'
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing from wishlist'
        });
    }
};

module.exports = {
    testWishlist,
    toggleWishlistItem,
    getWishlistItems,
    checkWishlistStatus,
    getWishlistPage,
    addToWishlist,
    removeFromWishlist
};
