import logger from './logger.js';

/**
 * Standard error response class to ensure consistent error format
 */
export class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Helps distinguish operational errors from programming errors
    this.errorCode = errorCode; // Custom error code for client identification

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error logging
 * @param {Error} err - The error object
 * @param {string} context - Where the error occurred (e.g., 'bookOfficeHourSlot')
 */
export const logError = (err, context = 'unknown') => {
  const errorDetails = {
    context,
    name: err.name,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    errorCode: err.errorCode
  };
  
  // Only log the full error in development
  if (process.env.NODE_ENV === 'production') {
    delete errorDetails.stack;
  }
  
  logger.error(`Error in ${context}: ${err.message}`, errorDetails);

  // Could implement additional error tracking here
  // e.g., send to a monitoring service like Sentry
};

/**
 * Convert mongoose validation errors to AppError format
 */
export const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Standardized error response format
 * @param {Error} err - The error object
 * @param {Response} res - Express response object
 */
export const sendErrorResponse = (err, res) => {
  // Add timestamp for easier debugging
  const timestamp = new Date().toISOString();
  
  // Determine if this is a known operational error or an unexpected one
  const statusCode = err.statusCode || 500;
  
  // Build the response object
  const errorResponse = {
    status: err.status || 'error',
    message: err.message || 'Something went wrong',
    timestamp
  };
  
  // Add error code if available
  if (err.errorCode) {
    errorResponse.code = err.errorCode;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    
    // Add original error details for mongoose errors
    if (err.name === 'ValidationError' && err.errors) {
      errorResponse.validationErrors = {};
      Object.keys(err.errors).forEach(field => {
        errorResponse.validationErrors[field] = err.errors[field].message;
      });
    }
  }
  
  // Send the error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Catch async errors in route handlers
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle database connection errors
 */
export const handleDBError = (err) => {
  // Handle specific DB errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      return new AppError(`Duplicate field value: ${field} with value: ${value}`, 400, 'DUPLICATE_VALUE');
    }
  }
  
  // Connection errors
  if (err.name === 'MongoNetworkError') {
    return new AppError('Database connection error', 500, 'DB_CONNECTION_ERROR');
  }
  
  // Default DB error
  return new AppError('Database error', 500, 'DATABASE_ERROR');
};