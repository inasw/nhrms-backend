import rateLimit from "express-rate-limit";

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 requests per windowMs
  standardHeaders: true, // Include RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit headers
  message: {
    success: false,
    error: "Too many requests, please try again later",
  },
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === "development" && req.ip === "::1";
  },
});

// Auth endpoints rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased to 20 for auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later",
  },
  skip: (req) => process.env.NODE_ENV === "development" && req.ip === "::1",
});

// Strict rate limiting for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased to 50 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Rate limit exceeded for sensitive operations",
  },
  skip: (req) => process.env.NODE_ENV === "development" && req.ip === "::1",
});

// Rate limiter specifically for /api/superadmin/admins
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for admin list endpoint
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests to fetch admins, please try again later",
  },
  skip: (req) => process.env.NODE_ENV === "development" && req.ip === "::1",
});