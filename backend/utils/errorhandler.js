const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle wrong MongoDB ID error
    if (err.name === "CastError") {
        message = `Resource not found. Invalid: ${err.path}`;
        err.statusCode = 400;
    }

    // // Handle duplicate key error (e.g., duplicate email)
    if (err.code && err.code === 11000) {
        const field = Object.keys(err.keyValue);
        message = `Duplicate field value entered: ${field}`;
        err.statusCode = 400;
    }

    // Handle JWT token expiration error
    if (err.name === "TokenExpiredError") {
        message = 'Your token has expired. Please log in again.';
        err.statusCode = 401;
    }

    // Handle invalid JWT token
    if (err.name === "JsonWebTokenError") {
        message = 'Invalid token. Please log in again.';
        err.statusCode = 401;
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        err.statusCode = 400;

        // Create a new object to store field-specific errors
        const validationErrors = {};
        Object.values(err.errors).forEach(properties => {
            validationErrors[properties.path] = properties.message;
        });

        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: false,
         
            error: validationErrors 
        });
    }

    res.status(statusCode).json({
        statusCode,
        success: false,
        message
    });
};

module.exports = errorHandler;
