const Booking = require('../models/booking');
const Mentor = require('../models/mentor');

const createBooking = async (req, res) => {
    try {
        const { tutorId, date, time, duration, subject, notes } = req.body;
        let formattedTime = time;
        if (time && time.includes(' - ')) {
            const timeParts = time.split(' - ');
            const startTimePart = timeParts[0]; 
            
            const timeMatch = startTimePart.match(/(\d+):(\d+)\s+(AM|PM)/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                const period = timeMatch[3].toUpperCase();
                if (period === 'PM' && hours < 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
            }
        }
        
        const booking = new Booking({
            student: req.user._id,
            tutor: tutorId,
            date: new Date(date),
            time: formattedTime,
            duration,
            subject,
            notes
        });
        
        await booking.save();
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to create booking'
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        if (booking.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        
        const bookingDate = new Date(booking.date);
        if (bookingDate < new Date()) {
            return res.status(400).json({ success: false, message: 'Cannot cancel past bookings' });
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getMyBookings=async (req, res) => {
    try {
        const userId = req.user.id;
        const userBookings = await Booking.find({ student: userId })
            .populate('tutor', 'username email')
            .sort({ date: 1 })
            .lean();
        const isMentor = await Mentor.exists({ user: userId });
        
        let mentorBookings = [];
        if (isMentor) {
            const mentorDoc = await Mentor.findOne({ user: userId });
            mentorBookings = await Booking.find({ tutor: mentorDoc._id })
                .populate('student', 'username email')
                .sort({ date: 1 })
                .lean();
        }
        res.render('mybookings', {
            userBookings,
            mentorBookings,
            isMentor: !!isMentor
        });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).send('Server Error');
    }
}

const updateBookingStatus=async (req, res) => {
    try {
        const { status } = req.body;
        const userId = req.user.id;
        const bookingId = req.params.id;
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status value' });
        }
        
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ msg: 'Booking not found' });
        }
        const mentorDoc = await Mentor.findOne({ user: userId });
        const isStudent = booking.student.toString() === userId;
        const isMentor = mentorDoc && booking.tutor.toString() === mentorDoc._id.toString();
        
        if (!isStudent && !isMentor) {
            return res.status(403).json({ msg: 'Not authorized to update this booking' });
        }
        if (isStudent && !isMentor) {
            if (status !== 'cancelled') {
                return res.status(403).json({ msg: 'Students can only cancel bookings' });
            }
        }
        booking.status = status;
        await booking.save();
        
        res.json({ booking });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).send('Server Error');
    }
}

module.exports={
    createBooking,
    cancelBooking,
    getMyBookings,
    updateBookingStatus
}