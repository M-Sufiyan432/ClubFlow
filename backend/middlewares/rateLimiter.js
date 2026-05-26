const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

const getForwardedIp = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value.split(',')[0].trim();
};

const getClientIp = (req) => {
  return (
    getForwardedIp(req.headers['cf-connecting-ip']) ||
    getForwardedIp(req.headers['x-real-ip']) ||
    getForwardedIp(req.headers['x-forwarded-for']) ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
};

const isLocalIp = (ip = '') => {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'].includes(ip);
};

const isDevLocalRequest = (req) => {
  return process.env.NODE_ENV !== 'production' && isLocalIp(getClientIp(req));
};

const getRetryAfterSeconds = (req) => {
  const resetTime = req.rateLimit?.resetTime;

  if (!resetTime) {
    return undefined;
  }

  const retryAfterMs = new Date(resetTime).getTime() - Date.now();
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
};

const baseLimiterConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: (req) => isDevLocalRequest(req) || req.path === '/health',
};

// General API rate limiter
const apiLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    (process.env.NODE_ENV === 'production' ? 300 : 5000),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${getClientIp(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: getRetryAfterSeconds(req)
    });
  }
});

// Auth rate limiter (stricter for login/register)
const authLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${getClientIp(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes.',
      retryAfter: getRetryAfterSeconds(req)
    });
  }
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 upload requests per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${getClientIp(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again in an hour.',
      retryAfter: getRetryAfterSeconds(req)
    });
  }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${getClientIp(req)}`);
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again in an hour.'
    });
  }
});

module.exports = apiLimiter;
module.exports.authLimiter = authLimiter;
module.exports.uploadLimiter = uploadLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
