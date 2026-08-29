const rateLimit = require('express-rate-limit');

// General API rate limiter: 60 requests per minute per IP
const globalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for Gemini/AI intensive routes: 10 requests per minute
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI request limit reached. Please wait a minute before asking another question.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalApiLimiter,
  aiLimiter
};
