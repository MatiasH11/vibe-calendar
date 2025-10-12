import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register)
 * Stricter limits to prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      error_code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests (only count them)
  skipFailedRequests: false,
});

/**
 * General API rate limiter for all endpoints
 * Moderate limits for normal API usage
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      error_code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for expensive operations
 * Used for bulk operations, complex queries, etc.
 */
export const strictRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for expensive operations
  message: {
    success: false,
    error: {
      error_code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests for this operation. Please wait before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
