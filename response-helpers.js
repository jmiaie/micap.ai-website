/**
 * Response Helper Functions
 * Centralized error and success response handling to reduce code duplication
 * and ensure consistent error reporting across all endpoints.
 */

const logger = require('./logger');

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 401, 429, 500, etc.)
 * @param {string} message - Error message to send to client
 * @param {Object} additionalData - Optional additional data to include in response
 */
function sendError(res, statusCode, message, additionalData = {}) {
  const errorResponse = {
    success: false,
    error: message,
    ...additionalData
  };
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to include in response
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data, statusCode = 200) {
  const successResponse = {
    success: true,
    ...data
  };
  
  res.status(statusCode).json(successResponse);
}

/**
 * Send a validation error response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 */
function sendValidationError(res, message) {
  sendError(res, 400, message);
}

/**
 * Send an unauthorized error response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized error message
 */
function sendUnauthorized(res, message = 'Unauthorized') {
  sendError(res, 401, message);
}

/**
 * Send a rate limit error response (429)
 * @param {Object} res - Express response object
 * @param {string} message - Rate limit message
 * @param {number} retryAfter - Seconds until retry is allowed
 */
function sendRateLimitError(res, message, retryAfter) {
  sendError(res, 429, message, { retryAfter });
}

/**
 * Send a server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Error} error - Optional Error object for logging
 */
function sendServerError(res, message, error = null) {
  if (error) {
    logger.error(message, { error: error.message, stack: error.stack, component: 'response-handler' });
  } else {
    logger.error(message, { component: 'response-handler' });
  }
  
  sendError(res, 500, message);
}

/**
 * Send a fallback response when primary API is unavailable
 * @param {Object} res - Express response object
 * @param {Object} fallbackData - Fallback data to return
 * @param {string} reason - Reason for using fallback
 */
function sendFallback(res, fallbackData, reason = 'Using cached results') {
  sendSuccess(res, {
    ...fallbackData,
    source: 'fallback',
    reason: reason
  });
}

module.exports = {
  sendError,
  sendSuccess,
  sendValidationError,
  sendUnauthorized,
  sendRateLimitError,
  sendServerError,
  sendFallback
};
