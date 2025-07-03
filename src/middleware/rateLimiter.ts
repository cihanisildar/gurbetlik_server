import rateLimit from 'express-rate-limit';

// Custom key generator that uses user ID if available, otherwise IP
const keyGenerator = (req: any) => {
  // If user is authenticated, use their ID for more accurate rate limiting
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Otherwise use IP address
  return req.ip;
};

// General API rate limiter - more lenient for read operations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.MAX_REQUESTS_PER_15MIN || '300'), // 300 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: (req) => {
    // Skip rate limiting for read operations (GET requests)
    return req.method === 'GET';
  }
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator,
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Email verification rate limiter
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 email verification requests per hour
  message: {
    success: false,
    message: 'Too many email verification requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Chat/message rate limiter
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Post creation rate limiter
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 posts per hour
  message: {
    success: false,
    message: 'Too many posts created, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Review creation rate limiter
export const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // limit each IP to 5 reviews per day
  message: {
    success: false,
    message: 'Too many reviews created today, please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Comment creation rate limiter
export const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 comments per 10 minutes
  message: {
    success: false,
    message: 'Too many comments created, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 searches per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Vote/rating rate limiter
export const voteLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 votes per 5 minutes
  message: {
    success: false,
    message: 'Too many votes, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
}); 