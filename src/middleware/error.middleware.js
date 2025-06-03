// Custom error class with enhanced functionality
export class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.errorCode = errorCode; // Custom error code for client identification

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler for async functions
export const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

// Global error handling middleware with enhanced logging and responses
export const errorHandler = (err, req, res, next) => {
    // Set default status values if not provided
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Handle common errors through specialized handlers
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.code === 11000) err = handleDuplicateFieldsError(err);
    if (err.name === 'ValidationError') err = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
    
    // Log errors for monitoring and debugging
    logError(err, req);

    if (process.env.NODE_ENV === 'development') {
        // Development error response - detailed for debugging
        return sendDevError(err, req, res);
    } 
    
    // Production error response - sanitized for security
    return sendProdError(err, req, res);
};

// Development environment error response
const sendDevError = (err, req, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        errorCode: err.errorCode,
        stack: err.stack,
        error: err
    });
};

// Production environment error response
const sendProdError = (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            errorCode: err.errorCode
        });
    }
    
    // Programming or unknown error: don't leak error details
    console.error('UNEXPECTED ERROR 💥', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our end. We\'re working on it!',
        errorCode: 'INTERNAL_SERVER_ERROR'
    });
};

// Enhanced error logging
const logError = (err, req) => {
    const timestamp = new Date().toISOString();
    const logData = {
        timestamp,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: err.statusCode,
        message: err.message,
        stack: err.stack
    };
    
    // Log operational errors at info level, programming errors at error level
    if (err.isOperational) {
        console.info(`[INFO] ${timestamp} - Operational error:`, logData);
    } else {
        console.error(`[ERROR] ${timestamp} - Programming error:`, logData);
    }
};

// Handle specific MongoDB and other errors
const handleCastError = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_INPUT');
};

const handleDuplicateFieldsError = err => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${value} for field ${field}. Please use another value!`;
    return new AppError(message, 400, 'DUPLICATE_VALUE');
};

const handleValidationError = err => {
    const errors = Object.values(err.errors).map(error => error.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

// Handle JWT errors
export const handleJWTError = () => 
    new AppError('Invalid authentication token. Please log in again!', 401, 'INVALID_TOKEN');

export const handleJWTExpiredError = () => 
    new AppError('Your authentication token has expired. Please log in again.', 401, 'EXPIRED_TOKEN');
