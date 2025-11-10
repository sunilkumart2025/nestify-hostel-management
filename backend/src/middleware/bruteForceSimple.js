// Simple brute force protection
const attempts = new Map();

const MAX_ATTEMPTS = 10;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

const checkBruteForce = (req, res, next) => {
  const key = `${req.body.email}_${req.ip}`;
  const attempt = attempts.get(key);
  
  if (attempt && attempt.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${remainingTime} minutes.`
    });
  }
  
  req.bruteForceKey = key;
  next();
};

const recordFailedAttempt = (key) => {
  const attempt = attempts.get(key) || { count: 0 };
  attempt.count += 1;
  attempt.lastAttempt = Date.now();
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_TIME;
  }
  
  attempts.set(key, attempt);
};

const recordSuccess = (key) => {
  attempts.delete(key);
};

module.exports = {
  checkBruteForce,
  recordFailedAttempt,
  recordSuccess
};