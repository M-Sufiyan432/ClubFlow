const { logger } = require('../config/logger');
const { captureException } = require('../config/sentry');

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  logger.error('http.request.error', {
    error: err.message,
    name: err.name,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
    userId: req.user?._id?.toString() || req.user?.id,
    clubId: req.clubId || req.club?._id?.toString() || req.headers['x-club-id']
  });

  captureException(err, {
    userId: req.user?._id?.toString() || req.user?.id,
    tags: {
      requestId: req.requestId,
      clubId: req.clubId || req.club?._id?.toString() || req.headers['x-club-id']
    },
    extra: {
      method: req.method,
      path: req.originalUrl,
      statusCode: err.statusCode
    }
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new ErrorResponse(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    requestId: req.requestId,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
module.exports.ErrorResponse = ErrorResponse;
