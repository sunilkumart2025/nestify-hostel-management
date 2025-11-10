const jwt = require('jsonwebtoken');
const { supabase } = require('../../config/supabase');

const isDemoMode = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co';

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    if (isDemoMode || token === 'demo-jwt-token') {
      // Demo mode: accept demo tokens
      req.user = { id: 'demo-user-id', role: 'tenant', adminId: 'demo-admin-id' };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (isDemoMode) {
      // Fallback to demo mode if JWT fails
      req.user = { id: 'demo-user-id', role: 'tenant', adminId: 'demo-admin-id' };
      return next();
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (isDemoMode) {
      req.admin = { id: 'demo-admin-id', name: 'Demo Admin', email: 'admin@demo.com' };
      return next();
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Verify admin exists and is active
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, is_verified')
      .eq('id', req.user.id)
      .single();

    if (error || !admin || !admin.is_verified) {
      return res.status(403).json({ error: 'Invalid admin account' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

const requireTenant = async (req, res, next) => {
  try {
    if (isDemoMode) {
      req.tenant = { id: 'demo-tenant-id', name: 'Demo Tenant', email: 'tenant@demo.com', admin_id: 'demo-admin-id' };
      return next();
    }

    if (req.user.role !== 'tenant') {
      return res.status(403).json({ error: 'Tenant access required' });
    }

    // Verify tenant exists and is active
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, email, is_active, admin_id')
      .eq('id', req.user.id)
      .single();

    if (error || !tenant || !tenant.is_active) {
      return res.status(403).json({ error: 'Invalid tenant account' });
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTenant
};