const { supabase } = require('../../config/supabase');

// In-memory store for login attempts (use Redis in production)
const loginAttempts = new Map();

const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION_MS) || 30 * 60 * 1000; // 30 minutes

const checkBruteForce = async (req, res, next) => {
  const { email } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;
  const key = `${email}_${clientIP}`;
  
  const attempt = loginAttempts.get(key);
  
  if (attempt) {
    // Check if account is locked
    if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
      const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        error: `Account temporarily locked. Try again in ${remainingTime} minutes.`,
        lockedUntil: attempt.lockedUntil
      });
    }
    
    // Reset if lockout period has passed
    if (attempt.lockedUntil && Date.now() >= attempt.lockedUntil) {
      loginAttempts.delete(key);
    }
  }
  
  req.bruteForceKey = key;
  next();
};

const recordFailedAttempt = (key) => {
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
  
  attempt.count += 1;
  attempt.lastAttempt = Date.now();
  
  // Lock account after max attempts
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION;
    
    // Log security event
    console.warn(`🚨 Account locked for excessive login attempts: ${key}`);
  }
  
  loginAttempts.set(key, attempt);
};

const recordSuccessfulLogin = (key) => {
  // Clear failed attempts on successful login
  loginAttempts.delete(key);
};

// Clean up old entries every hour
const cleanupOldAttempts = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.firstAttempt > maxAge) {
      loginAttempts.delete(key);
    }
  }
};

setInterval(cleanupOldAttempts, 60 * 60 * 1000);

module.exports = {
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulLogin
};