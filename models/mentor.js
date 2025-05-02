const mongoose = require('mongoose');

const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mentorSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    name: String,
    about: String,
    profilePhoto: String,
    countryOfBirth: String,
    currentCountry: String,
    currentCity: String,
    status: String,
    collegeName: String,
    workingField: String,
    languages: {
        type: [{
            language: {
                type: String,
                required: [true, 'Language name is required']
            },
            proficiency: {
                type: String,
                enum: {
                    values: ['Native', 'Advanced', 'Intermediate', 'Beginner'],
                    message: '{VALUE} is not a valid proficiency level'
                },
                required: [true, 'Proficiency level is required']
            }
        }],
        validate: {
            validator: function(arr) {
                return arr.every(item => 
                    item.language && 
                    item.proficiency && 
                    ['Native', 'Advanced', 'Intermediate', 'Beginner'].includes(item.proficiency)
                );
            },
            message: 'Invalid language data structure'
        },
        default: []
    },
    price30: {
        type: Number,
        required: [true, 'Price for 30 minutes is required'],
        min: [0, 'Price cannot be negative']
    },
    price60: {
        type: Number,
        required: [true, 'Price for 60 minutes is required'],
        min: [0, 'Price cannot be negative']
    },
    availableDates: {
        type: [String],
        validate: {
            validator: function(dates) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                return dates.every(date => dateRegex.test(date));
            },
            message: 'Dates must be in YYYY-MM-DD format'
        },
        default: []
    },
    timeSlots: {
        type: [{
            time: {
                type: String,
                required: [true, 'Time slot is required']
            },
            duration: {
                type: Number,
                enum: [30, 60],
                required: [true, 'Duration is required'],
                default: 60
            }
        }],
        default: []
    },
    days: {
        type: [String],
        validate: {
            validator: function(days) {
                return days.every(day => validDays.includes(day));
            },
            message: 'Invalid day name. Must be one of: ' + validDays.join(', ')
        },
        default: []
    },
    applicationStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    rejectionReason: String,
    documents: {
        idProof: String,
        collegeId: String,
        addressProof: String,
        additionalDoc: String
    },
    hasLoan: {
        type: Boolean,
        default: false
    },
    loanDetails: {
        amount: {
            type: Number,
            min: [0, 'Loan amount cannot be negative']
        },
        purpose: {
            type: String,
            trim: true
        }
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true,
    strict: true
});
mentorSchema.pre('save', function(next) {
    if (!Array.isArray(this.languages)) {
        this.languages = [];
    }
    this.languages = this.languages.filter(lang => 
        lang && 
        typeof lang === 'object' && 
        lang.language && 
        lang.proficiency && 
        ['Native', 'Advanced', 'Intermediate', 'Beginner'].includes(lang.proficiency)
    );
    if (this.hasLoan && (!this.loanDetails || !this.loanDetails.amount)) {
        this.hasLoan = false;
        this.loanDetails = undefined;
    }

    next();
});

module.exports = mongoose.model('Mentor', mentorSchema);