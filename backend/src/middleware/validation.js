const Joi = require('joi');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(validator.escape(input.trim()));
  }
  return input;
};

// Enhanced password validation
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'password')
  .required()
  .messages({
    'string.pattern.name': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

const validateAdminSignup = (req, res, next) => {
  // Sanitize inputs
  Object.keys(req.body).forEach(key => {
    req.body[key] = sanitizeInput(req.body[key]);
  });

  const schema = Joi.object({
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s]+$/).required(),
    email: Joi.string().email().max(255).required(),
    phone: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required(),
    altPhone: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).optional().allow(''),
    address: Joi.string().max(500).optional().allow(''),
    hostelName: Joi.string().min(2).max(200).required(),
    hostelAddress: Joi.string().min(5).max(500).required(),
    password: passwordSchema,
    nestKey: Joi.string().alphanum().min(8).max(50).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

const validateLogin = (req, res, next) => {
  // Sanitize inputs
  req.body.email = sanitizeInput(req.body.email);
  
  const schema = Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(1).max(128).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: error.details[0].message 
    });
  }
  next();
};

// SQL injection prevention
const validateSQLInput = (req, res, next) => {
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i
  ];
  
  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };
  
  const hasSQLInjection = Object.values(req.body).some(checkValue) ||
                         Object.values(req.query).some(checkValue) ||
                         Object.values(req.params).some(checkValue);
  
  if (hasSQLInjection) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }
  
  next();
};

module.exports = {
  validateAdminSignup,
  validateLogin,
  validateSQLInput,
  sanitizeInput
};