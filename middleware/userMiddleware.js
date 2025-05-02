const logRequests = (req, res, next) => {
    console.log(`[Tutor Route] ${req.method} ${req.originalUrl}`);
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    next();
};

const errorHandler = (err, req, res, next) => {
    console.error('Tutor Route Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
};

module.exports = {
    logRequests,
    errorHandler
};