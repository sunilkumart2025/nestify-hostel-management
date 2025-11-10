// Safe sanitization that won't break login
const safeSanitize = (req, res, next) => {
  // Only sanitize non-auth routes
  if (req.path.includes('/auth/')) {
    return next();
  }
  
  // Basic sanitization for other routes
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

module.exports = { safeSanitize };