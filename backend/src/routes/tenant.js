const express = require('express');
const { supabase } = require('../../config/supabase');
const { authenticateToken, requireTenant } = require('../auth/middleware');
const { logInfo, logError, logSuccess } = require('../utils/logger');

const router = express.Router();
const isDemoMode = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co';

// Apply authentication middleware to all tenant routes
router.use(authenticateToken);
router.use(requireTenant);

// Tenant Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        tenant: { name: 'Demo Tenant', registration_id: 'REG001', admission_date: '2024-01-15', rooms: { room_number: 'A-101', rent_amount: 5000 }, admins: { hostel_name: 'Demo Hostel' } },
        pendingBillsCount: 2,
        recentPayments: [{ id: '1', amount: 5000, transaction_date: new Date().toISOString(), bills: { bill_number: 'BILL202412001', billing_month: 12, billing_year: 2024 } }]
      });
    }

    const tenantId = req.tenant.id;

    // Get tenant details with room info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(`
        id, name, registration_id, admission_date,
        rooms(room_number, rent_amount),
        admins(hostel_name)
      `)
      .eq('id', tenantId)
      .single();

    if (tenantError) throw tenantError;

    // Get pending bills count
    const { data: pendingBills, error: pendingError } = await supabase
      .from('bills')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    // Get recent payments
    const { data: recentPayments, error: paymentsError } = await supabase
      .from('transactions')
      .select(`
        id, amount, payment_method, transaction_date,
        bills(bill_number, billing_month, billing_year)
      `)
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'success')
      .order('transaction_date', { ascending: false })
      .limit(5);

    res.json({
      tenant,
      pendingBillsCount: pendingBills?.length || 0,
      recentPayments: recentPayments || []
    });
  } catch (error) {
    logError('Tenant dashboard error', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get tenant bills
router.get('/bills', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json([
        { id: '1', bill_number: 'BILL202501001', billing_month: 1, billing_year: 2025, room_rent: 5000, electricity_charges: 300, water_charges: 200, maintenance_charges: 0, internet_charges: 0, total_amount: 5500, status: 'pending', rooms: { room_number: 'A-101' } },
        { id: '2', bill_number: 'BILL202412001', billing_month: 12, billing_year: 2024, room_rent: 5000, electricity_charges: 250, water_charges: 200, maintenance_charges: 100, internet_charges: 150, total_amount: 5700, status: 'paid', rooms: { room_number: 'A-101' } }
      ]);
    }

    const { status } = req.query;
    const tenantId = req.tenant.id;

    let query = supabase
      .from('bills')
      .select(`
        id, bill_number, billing_month, billing_year, 
        room_rent, electricity_charges, water_charges, 
        maintenance_charges, internet_charges, other_charges,
        total_amount, status, created_at,
        rooms(room_number)
      `)
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bills, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(bills);
  } catch (error) {
    logError('Get tenant bills error', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get specific bill details
router.get('/bills/:id', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        id: req.params.id,
        bill_number: 'BILL202501001',
        billing_month: 1,
        billing_year: 2025,
        room_rent: 5000,
        electricity_charges: 300,
        water_charges: 200,
        maintenance_charges: 0,
        internet_charges: 0,
        total_amount: 5500,
        status: 'pending',
        rooms: { room_number: 'A-101' },
        admins: { hostel_name: 'Demo Hostel', hostel_address: '123 Demo Street', phone: '+91 9876543210', email: 'admin@demo.com' },
        tenants: { name: 'Demo Tenant', registration_id: 'REG001', phone: '+91 9876543210' }
      });
    }

    const { id } = req.params;
    const tenantId = req.tenant.id;

    const { data: bill, error } = await supabase
      .from('bills')
      .select(`
        id, bill_number, billing_month, billing_year,
        room_rent, electricity_charges, water_charges,
        maintenance_charges, internet_charges, other_charges,
        total_amount, status, created_at,
        rooms(room_number),
        admins(hostel_name, hostel_address, phone, email),
        tenants(name, registration_id, phone)
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    res.json(bill);
  } catch (error) {
    logError('Get bill details error', error);
    res.status(500).json({ error: 'Failed to fetch bill details' });
  }
});

// Get tenant profile
router.get('/profile', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        id: 'demo-tenant-id', name: 'Demo Tenant', email: 'tenant@demo.com', phone: '+91 9876543210', registration_id: 'REG001', admission_date: '2024-01-15',
        rooms: { room_number: 'A-101', rent_amount: 5000 }, admins: { hostel_name: 'Demo Hostel', hostel_address: '123 Demo Street, Demo City' }
      });
    }

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select(`
        id, registration_id, name, email, phone, alt_phone, 
        address, admission_date, is_active,
        rooms(room_number, rent_amount),
        admins(hostel_name, hostel_address)
      `)
      .eq('id', req.tenant.id)
      .single();

    if (error) throw error;
    res.json(tenant);
  } catch (error) {
    logError('Get tenant profile error', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update tenant profile (limited fields)
router.put('/profile', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Profile updated (demo)', ...req.body });
    }

    const { phone, altPhone, address } = req.body;

    const { data: tenant, error } = await supabase
      .from('tenants')
      .update({
        phone,
        alt_phone: altPhone,
        address
      })
      .eq('id', req.tenant.id)
      .select()
      .single();

    if (error) throw error;
    logSuccess('Tenant profile updated', { tenantId: req.tenant.id });
    res.json(tenant);
  } catch (error) {
    logError('Update tenant profile error', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get payment history
router.get('/payments', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json([{ id: '1', razorpay_payment_id: 'pay_demo123', amount: 5000, payment_method: 'upi', payment_status: 'success', transaction_date: new Date().toISOString(), bills: { bill_number: 'BILL202412001', billing_month: 12, billing_year: 2024 } }]);
    }

    const tenantId = req.tenant.id;

    const { data: payments, error } = await supabase
      .from('transactions')
      .select(`
        id, razorpay_payment_id, amount, payment_method, 
        payment_status, transaction_date,
        bills(bill_number, billing_month, billing_year)
      `)
      .eq('tenant_id', tenantId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    logError('Get payment history error', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

module.exports = router;