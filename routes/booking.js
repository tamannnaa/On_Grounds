const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const {createBooking,cancelBooking,getMyBookings,updateBookingStatus}=require("../controllers/bookingController");

router.post('/create', isAuthenticated, createBooking);
router.put('/cancel/:id', isAuthenticated, cancelBooking);
router.get('/my-bookings', isAuthenticated, getMyBookings);
router.put('/:id/status', isAuthenticated,updateBookingStatus );
module.exports = router;