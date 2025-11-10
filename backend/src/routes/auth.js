const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../config/supabase');
const { sendOTP, verifyOTP } = require('../email/otpService');
const { generateStayKey, generateRegistrationId } = require('../utils/generators');
const Joi = require('joi');

// Simple validation functions
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
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};
const { logInfo, logError, logSuccess, logWarning } = require('../utils/logger');
const { checkBruteForce, recordFailedAttempt, recordSuccess } = require('../middleware/bruteForceSimple');
const { createSession } = require('../middleware/advancedAuth');
const { checkGlobalCapacity, createGlobalSession, logGlobalLoginAttempt } = require('../middleware/globalSecurity');

const router = express.Router();

// Check if we're in demo mode
const isDemoMode = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co';

// Admin Signup
router.post('/admin/signup', validateAdminSignup, async (req, res) => {
  try {
    if (isDemoMode) {
      const { nestKey } = req.body;
      if (nestKey !== 'NEST2025SECURE') {
        return res.status(400).json({ error: 'Invalid NestKey' });
      }
      return res.status(201).json({
        message: 'Admin account created successfully. Please verify your email.',
        adminId: 'demo-admin-id'
      });
    }

    const { name, email, phone, altPhone, address, hostelName, hostelAddress, password, nestKey } = req.body;

    // Verify NestKey
    const { data: config, error: configError } = await supabase
      .from('system_config')
      .select('nest_key')
      .eq('is_active', true)
      .single();

    if (configError || !config || config.nest_key !== nestKey) {
      return res.status(400).json({ error: 'Invalid NestKey' });
    }

    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const stayKey = generateStayKey();

    // Create admin
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        name,
        email,
        phone,
        alt_phone: altPhone,
        address,
        hostel_name: hostelName,
        hostel_address: hostelAddress,
        password_hash: passwordHash,
        stay_key: stayKey
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create admin account' });
    }

    // Send verification OTP
    await sendOTP(email, 'signup');
    logSuccess('Admin account created', { email, adminId: admin.id });

    res.status(201).json({
      message: 'Admin account created successfully. Please verify your email.',
      adminId: admin.id
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant Signup
router.post('/tenant/signup', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(201).json({
        message: 'Tenant account created successfully',
        tenantId: 'demo-tenant-id',
        hostelName: 'Demo Hostel'
      });
    }

    const { name, email, phone, altPhone, address, password, stayKey, admissionDate } = req.body;

    // Verify StayKey and get admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, hostel_name')
      .eq('stay_key', stayKey)
      .eq('is_verified', true)
      .single();

    if (adminError || !admin) {
      return res.status(400).json({ error: 'Invalid StayKey or hostel not found' });
    }

    // Check if email already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('email')
      .eq('email', email)
      .single();

    if (existingTenant) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const registrationId = generateRegistrationId();

    // Create tenant
    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({
        admin_id: admin.id,
        registration_id: registrationId,
        name,
        email,
        phone,
        alt_phone: altPhone,
        address,
        password_hash: passwordHash,
        admission_date: admissionDate
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to create tenant account' });
    }

    res.status(201).json({
      message: 'Tenant account created successfully',
      tenantId: tenant.id,
      hostelName: admin.hostel_name
    });
  } catch (error) {
    console.error('Tenant signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Login
router.post('/admin/login', checkGlobalCapacity, checkBruteForce, async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        token: 'demo-jwt-token',
        user: {
          id: 'demo-admin-id',
          name: 'Demo Admin',
          email: req.body.email,
          role: 'admin'
        }
      });
    }

    const { email, password } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, password_hash, is_verified')
      .eq('email', email)
      .single();

    if (error || !admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!admin.is_verified) {
      return res.status(401).json({ error: 'Please verify your email first' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      recordFailedAttempt(req.bruteForceKey);
      await logGlobalLoginAttempt(email, 'admin', false, admin.id, req, 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    recordSuccess(req.bruteForceKey);
    createSession(admin.id, 'admin', req.get('User-Agent'), req.ip);
    await createGlobalSession(admin.id, 'admin', email, admin.id, req);
    await logGlobalLoginAttempt(email, 'admin', true, admin.id, req);
    
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant Login
router.post('/tenant/login', checkGlobalCapacity, checkBruteForce, async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        token: 'demo-jwt-token',
        user: {
          id: 'demo-tenant-id',
          name: 'Demo Tenant',
          email: req.body.email,
          role: 'tenant'
        }
      });
    }

    const { email, password } = req.body;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, email, password_hash, is_active, admin_id')
      .eq('email', email)
      .single();

    if (error || !tenant) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!tenant.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValidPassword = await bcrypt.compare(password, tenant.password_hash);
    if (!isValidPassword) {
      recordFailedAttempt(req.bruteForceKey);
      await logGlobalLoginAttempt(email, 'tenant', false, tenant.admin_id, req, 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    recordSuccess(req.bruteForceKey);
    createSession(tenant.id, 'tenant', req.get('User-Agent'), req.ip);
    await createGlobalSession(tenant.id, 'tenant', email, tenant.admin_id, req);
    await logGlobalLoginAttempt(email, 'tenant', true, tenant.admin_id, req);
    
    const token = jwt.sign(
      { id: tenant.id, email: tenant.email, role: 'tenant', adminId: tenant.admin_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        role: 'tenant'
      }
    });
  } catch (error) {
    console.error('Tenant login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Email OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (isDemoMode) {
      if (otp && otp.length === 6) {
        return res.json({ message: 'OTP verified successfully (demo mode)' });
      } else {
        return res.status(400).json({ error: 'Please enter any 6-digit code for demo' });
      }
    }

    const isValid = await verifyOTP(email, otp, purpose);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (purpose === 'signup') {
      // Activate admin account
      await supabase
        .from('admins')
        .update({ is_verified: true })
        .eq('email', email);
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Password reset OTP sent (demo mode)' });
    }

    const { email, userType } = req.body;

    const table = userType === 'admin' ? 'admins' : 'tenants';
    const { data: user } = await supabase
      .from(table)
      .select('email')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'Email not found' });
    }

    await sendOTP(email, 'password_reset');
    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Password reset successfully (demo mode)' });
    }

    const { email, otp, newPassword, userType } = req.body;

    const isValid = await verifyOTP(email, otp, 'password_reset');
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const table = userType === 'admin' ? 'admins' : 'tenants';

    await supabase
      .from(table)
      .update({ password_hash: passwordHash })
      .eq('email', email);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;