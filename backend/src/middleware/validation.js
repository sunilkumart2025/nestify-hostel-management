const Joi = require('joi');

const validateAdminSignup = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).required(),
    altPhone: Joi.string().pattern(/^[+]?[0-9]{10,15}$/).optional().allow(''),
    address: Joi.string().max(500).optional().allow(''),
    hostelName: Joi.string().min(2).max(200).required(),
    hostelAddress: Joi.string().min(5).max(500).required(),
    password: Joi.string().min(6).max(100).required(),
    nestKey: Joi.string().required()
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
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
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

module.exports = {
  validateAdminSignup,
  validateLogin
};