const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tutor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentor',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: props => `${props.value} is not a valid time format! Use HH:MM`
        }
    },
    duration: {
        type: Number,
        enum: [30, 60],
        default: 60,
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        min: [0, 'Payment amount cannot be negative']
    }
}, {
    timestamps: true
});

bookingSchema.index({ student: 1, date: -1 });
bookingSchema.index({ tutor: 1, date: -1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);