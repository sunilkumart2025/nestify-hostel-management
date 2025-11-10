const validator = require('validator');

// Simple XSS protection
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

// SQL injection detection
const detectSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /('|(\\-\\-)|(;)|(\\||\\|)|(\\*|\\*))/i,
    /(union|select|insert|delete|update|drop|create|alter)/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const allValues = [
    ...Object.values(req.body || {}),
    ...Object.values(req.query || {}),
    ...Object.values(req.params || {})
  ];
  
  if (allValues.some(checkValue)) {
    console.warn('🚨 SQL injection attempt detected:', req.originalUrl);
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      req.body[key] = sanitizeInput(req.body[key]);
    });
  }
  next();
};

module.exports = {
  sanitizeInput,
  detectSQLInjection,
  sanitizeBody
};