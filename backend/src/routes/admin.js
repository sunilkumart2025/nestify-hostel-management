const express = require('express');
const { supabase } = require('../../config/supabase');
const { authenticateToken, requireAdmin } = require('../auth/middleware');
const { generateStayKey, generateBillNumber } = require('../utils/generators');
const { sendOTP, verifyOTP } = require('../email/otpService');
const { logInfo, logError, logSuccess } = require('../utils/logger');

const router = express.Router();
const isDemoMode = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co';

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin Dashboard Data
router.get('/dashboard', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        totalTenants: 15, occupiedRooms: 12, availableRooms: 8,
        monthlyCollection: { current: 45000, previous: 42000, change: 7.1 },
        recentTransactions: [{ id: '1', amount: 5000, tenants: { name: 'John Doe' }, bills: { bill_number: 'BILL202501001' }, transaction_date: new Date().toISOString() }],
        pendingPayments: [{ id: '1', total_amount: 5500, tenants: { name: 'Jane Smith' }, rooms: { room_number: 'A-101' }, billing_month: 1, billing_year: 2025 }]
      });
    }

    const adminId = req.admin.id;

    // Get total tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, created_at')
      .eq('admin_id', adminId)
      .eq('is_active', true);

    // Get rooms data
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, is_occupied')
      .eq('admin_id', adminId);

    // Get monthly collection
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const { data: currentMonthBills } = await supabase
      .from('bills')
      .select('total_amount')
      .eq('admin_id', adminId)
      .eq('billing_month', currentMonth)
      .eq('billing_year', currentYear)
      .eq('status', 'paid');

    const { data: lastMonthBills } = await supabase
      .from('bills')
      .select('total_amount')
      .eq('admin_id', adminId)
      .eq('billing_month', currentMonth === 1 ? 12 : currentMonth - 1)
      .eq('billing_year', currentMonth === 1 ? currentYear - 1 : currentYear)
      .eq('status', 'paid');

    // Get recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select(`
        id, amount, payment_method, transaction_date,
        tenants(name),
        bills(bill_number)
      `)
      .eq('admin_id', adminId)
      .eq('payment_status', 'success')
      .order('transaction_date', { ascending: false })
      .limit(5);

    // Get pending payments
    const { data: pendingPayments } = await supabase
      .from('bills')
      .select(`
        id, bill_number, total_amount, billing_month, billing_year,
        tenants(name, registration_id),
        rooms(room_number)
      `)
      .eq('admin_id', adminId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const totalTenants = tenants?.length || 0;
    const occupiedRooms = rooms?.filter(room => room.is_occupied).length || 0;
    const availableRooms = (rooms?.length || 0) - occupiedRooms;
    
    const currentMonthCollection = currentMonthBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;
    const lastMonthCollection = lastMonthBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;

    res.json({
      totalTenants,
      occupiedRooms,
      availableRooms,
      monthlyCollection: {
        current: currentMonthCollection,
        previous: lastMonthCollection,
        change: lastMonthCollection > 0 ? ((currentMonthCollection - lastMonthCollection) / lastMonthCollection * 100) : 0
      },
      recentTransactions: recentTransactions || [],
      pendingPayments: pendingPayments || []
    });
  } catch (error) {
    logError('Dashboard error', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Room Management
router.get('/rooms', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json([
        { id: '1', room_number: 'A-101', occupancy_limit: 2, room_type: 'Double', location: 'First Floor', rent_amount: 5000, is_occupied: true, tenants: { name: 'John Doe' } },
        { id: '2', room_number: 'A-102', occupancy_limit: 1, room_type: 'Single', location: 'First Floor', rent_amount: 6000, is_occupied: false }
      ]);
    }

    const { data: rooms, error } = await supabase
      .from('rooms')
      .select(`
        id, room_number, occupancy_limit, room_type, location, rent_amount, is_occupied,
        tenants(id, name, registration_id)
      `)
      .eq('admin_id', req.admin.id)
      .order('room_number');

    if (error) throw error;
    res.json(rooms);
  } catch (error) {
    logError('Get rooms error', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

router.post('/rooms', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(201).json({ id: 'new-room-id', ...req.body, is_occupied: false });
    }

    const { roomNumber, occupancyLimit, roomType, location, rentAmount } = req.body;

    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        admin_id: req.admin.id,
        room_number: roomNumber,
        occupancy_limit: occupancyLimit,
        room_type: roomType,
        location,
        rent_amount: rentAmount
      })
      .select()
      .single();

    if (error) throw error;
    logSuccess('Room created', { roomNumber, adminId: req.admin.id });
    res.status(201).json(room);
  } catch (error) {
    logError('Create room error', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.put('/rooms/:id', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ id: req.params.id, ...req.body });
    }

    const { id } = req.params;
    const { roomNumber, occupancyLimit, roomType, location, rentAmount } = req.body;

    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        room_number: roomNumber,
        occupancy_limit: occupancyLimit,
        room_type: roomType,
        location,
        rent_amount: rentAmount
      })
      .eq('id', id)
      .eq('admin_id', req.admin.id)
      .select()
      .single();

    if (error) throw error;
    res.json(room);
  } catch (error) {
    logError('Update room error', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

router.delete('/rooms/:id', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Room deleted successfully (demo)' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)
      .eq('admin_id', req.admin.id);

    if (error) throw error;
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    logError('Delete room error', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Tenant Management
router.get('/tenants', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json([{ id: '1', name: 'John Doe', email: 'john@example.com', registration_id: 'REG001', is_active: true, rooms: { room_number: 'A-101', rent_amount: 5000 } }]);
    }

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select(`
        id, registration_id, name, email, phone, admission_date, is_active,
        rooms(id, room_number, rent_amount)
      `)
      .eq('admin_id', req.admin.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(tenants);
  } catch (error) {
    logError('Get tenants error', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.put('/tenants/:id/room', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Room assigned successfully (demo)' });
    }

    const { id } = req.params;
    const { roomId } = req.body;

    // Update tenant's room
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ room_id: roomId })
      .eq('id', id)
      .eq('admin_id', req.admin.id);

    if (tenantError) throw tenantError;

    // Update room occupancy
    if (roomId) {
      await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('id', roomId);
    }

    res.json({ message: 'Room assigned successfully' });
  } catch (error) {
    logError('Assign room error', error);
    res.status(500).json({ error: 'Failed to assign room' });
  }
});

// Billing Management
router.get('/bills', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json([{ id: '1', bill_number: 'BILL202501001', billing_month: 1, billing_year: 2025, total_amount: 5500, status: 'pending', tenants: { name: 'John Doe' }, rooms: { room_number: 'A-101' } }]);
    }

    const { month, year, status } = req.query;
    
    let query = supabase
      .from('bills')
      .select(`
        id, bill_number, billing_month, billing_year, total_amount, status, created_at,
        tenants(name, registration_id),
        rooms(room_number)
      `)
      .eq('admin_id', req.admin.id);

    if (month) query = query.eq('billing_month', parseInt(month));
    if (year) query = query.eq('billing_year', parseInt(year));
    if (status) query = query.eq('status', status);

    const { data: bills, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(bills);
  } catch (error) {
    logError('Get bills error', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.post('/bills', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(201).json({ id: 'demo-bill', bill_number: 'BILL202501001', message: 'Bill created (demo)' });
    }

    const { tenantId, month, year, roomRent, electricityCharges, waterCharges, maintenanceCharges, internetCharges, otherCharges } = req.body;

    // Get tenant's room info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('room_id')
      .eq('id', tenantId)
      .eq('admin_id', req.admin.id)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const totalAmount = parseFloat(roomRent || 0) + parseFloat(electricityCharges || 0) + 
                       parseFloat(waterCharges || 0) + parseFloat(maintenanceCharges || 0) + 
                       parseFloat(internetCharges || 0) + parseFloat(otherCharges || 0);

    const billNumber = generateBillNumber(req.admin.id, month, year);

    const { data: bill, error } = await supabase
      .from('bills')
      .insert({
        admin_id: req.admin.id,
        tenant_id: tenantId,
        room_id: tenant.room_id,
        bill_number: billNumber,
        billing_month: month,
        billing_year: year,
        room_rent: roomRent || 0,
        electricity_charges: electricityCharges || 0,
        water_charges: waterCharges || 0,
        maintenance_charges: maintenanceCharges || 0,
        internet_charges: internetCharges || 0,
        other_charges: otherCharges || 0,
        total_amount: totalAmount
      })
      .select()
      .single();

    if (error) throw error;
    logSuccess('Bill created', { billNumber, tenantId, totalAmount });
    res.status(201).json(bill);
  } catch (error) {
    logError('Create bill error', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Profile Management
router.get('/profile', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ id: 'demo-admin-id', name: 'Demo Admin', email: 'admin@demo.com', phone: '+91 9876543210', hostel_name: 'Demo Hostel', stay_key: 'STAY12345678', razorpay_key_id: 'rzp_test_1234567890' });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, phone, alt_phone, address, hostel_name, hostel_address, stay_key, razorpay_key_id')
      .eq('id', req.admin.id)
      .single();

    if (error) throw error;
    res.json(admin);
  } catch (error) {
    logError('Get profile error', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Profile updated (demo)', ...req.body });
    }

    const { name, phone, altPhone, address, hostelName, hostelAddress } = req.body;

    const { data: admin, error } = await supabase
      .from('admins')
      .update({
        name,
        phone,
        alt_phone: altPhone,
        address,
        hostel_name: hostelName,
        hostel_address: hostelAddress
      })
      .eq('id', req.admin.id)
      .select()
      .single();

    if (error) throw error;
    res.json(admin);
  } catch (error) {
    logError('Update profile error', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/regenerate-stay-key', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ stayKey: 'STAY' + Math.random().toString(36).substr(2, 8).toUpperCase() });
    }

    const newStayKey = generateStayKey();

    const { error } = await supabase
      .from('admins')
      .update({ stay_key: newStayKey })
      .eq('id', req.admin.id);

    if (error) throw error;
    logSuccess('StayKey regenerated', { adminId: req.admin.id, newStayKey });
    res.json({ stayKey: newStayKey });
  } catch (error) {
    logError('Regenerate stay key error', error);
    res.status(500).json({ error: 'Failed to regenerate stay key' });
  }
});

router.put('/payment-settings', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Payment settings updated (demo)' });
    }

    const { razorpayKeyId, razorpayKeySecret, otp } = req.body;

    // Verify OTP
    const isValid = await verifyOTP(req.admin.email, otp, 'profile_update');
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const { error } = await supabase
      .from('admins')
      .update({
        razorpay_key_id: razorpayKeyId,
        razorpay_key_secret: razorpayKeySecret
      })
      .eq('id', req.admin.id);

    if (error) throw error;
    logSuccess('Payment settings updated', { adminId: req.admin.id });
    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    logError('Update payment settings error', error);
    res.status(500).json({ error: 'Failed to update payment settings' });
  }
});

router.post('/send-profile-otp', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'OTP sent (demo mode)' });
    }

    await sendOTP(req.admin.email, 'profile_update');
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    logError('Send profile OTP error', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Download invoice for admin
router.get('/invoice/:billId', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(501).json({ 
        error: 'PDF generation not available in demo mode. Database connection required.' 
      });
    }

    const { billId } = req.params;
    const adminId = req.admin.id;
    const { generateInvoicePDF } = require('../utils/pdfGenerator');

    // Get bill details
    const { data: bill, error } = await supabase
      .from('bills')
      .select(`
        id, bill_number, billing_month, billing_year,
        room_rent, electricity_charges, water_charges,
        maintenance_charges, internet_charges, other_charges,
        total_amount, status, created_at, admin_id, room_id, tenant_id
      `)
      .eq('id', billId)
      .eq('admin_id', adminId)
      .eq('status', 'paid')
      .single();

    if (error || !bill) {
      return res.status(404).json({ error: 'Paid bill not found' });
    }

    // Get related data
    const [roomResult, adminResult, tenantResult, transactionResult] = await Promise.all([
      supabase.from('rooms').select('room_number').eq('id', bill.room_id).single(),
      supabase.from('admins').select('hostel_name, hostel_address, phone, email').eq('id', bill.admin_id).single(),
      supabase.from('tenants').select('name, registration_id, phone').eq('id', bill.tenant_id).single(),
      supabase.from('transactions').select('razorpay_payment_id, transaction_date, payment_method').eq('bill_id', billId).single()
    ]);

    // Combine all data
    const billWithRelations = {
      ...bill,
      rooms: roomResult.data,
      admins: adminResult.data,
      tenants: tenantResult.data,
      transactions: transactionResult.data
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(billWithRelations);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${bill.bill_number}.pdf"`);
    res.send(pdfBuffer);

    logSuccess('Admin invoice downloaded', { billId, adminId });
  } catch (error) {
    logError('Admin download invoice error', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Mark bill as paid (cash payment)
router.put('/bills/:id/mark-paid', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Bill marked as paid (demo)' });
    }

    const { id } = req.params;
    const { paymentMethod = 'cash', transactionReference } = req.body;
    const adminId = req.admin.id;

    // Get bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .eq('admin_id', adminId)
      .single();

    if (billError || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Update bill status
    const { error: updateError } = await supabase
      .from('bills')
      .update({ status: 'paid' })
      .eq('id', id);

    if (updateError) throw updateError;

    // Create transaction record
    await supabase
      .from('transactions')
      .insert({
        bill_id: id,
        admin_id: adminId,
        tenant_id: bill.tenant_id,
        transaction_reference: transactionReference || `CASH-${bill.bill_number}`,
        amount: bill.total_amount,
        payment_method: paymentMethod,
        payment_status: 'success'
      });

    logSuccess('Bill marked as paid', { billId: id, paymentMethod });
    res.json({ message: 'Bill marked as paid successfully' });
  } catch (error) {
    logError('Mark bill paid error', error);
    res.status(500).json({ error: 'Failed to mark bill as paid' });
  }
});

// Update bill
router.put('/bills/:id', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Bill updated (demo)' });
    }

    const { id } = req.params;
    const { roomRent, electricityCharges, waterCharges, maintenanceCharges, internetCharges, otherCharges } = req.body;
    const adminId = req.admin.id;

    const totalAmount = parseFloat(roomRent || 0) + parseFloat(electricityCharges || 0) + 
                       parseFloat(waterCharges || 0) + parseFloat(maintenanceCharges || 0) + 
                       parseFloat(internetCharges || 0) + parseFloat(otherCharges || 0);

    const { error } = await supabase
      .from('bills')
      .update({
        room_rent: roomRent || 0,
        electricity_charges: electricityCharges || 0,
        water_charges: waterCharges || 0,
        maintenance_charges: maintenanceCharges || 0,
        internet_charges: internetCharges || 0,
        other_charges: otherCharges || 0,
        total_amount: totalAmount
      })
      .eq('id', id)
      .eq('admin_id', adminId)
      .eq('status', 'pending');

    if (error) throw error;
    res.json({ message: 'Bill updated successfully' });
  } catch (error) {
    logError('Update bill error', error);
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// Delete bill
router.delete('/bills/:id', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ message: 'Bill deleted (demo)' });
    }

    const { id } = req.params;
    const adminId = req.admin.id;

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('admin_id', adminId)
      .eq('status', 'pending');

    if (error) throw error;
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    logError('Delete bill error', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Analytics endpoint
router.get('/analytics', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        totalRevenue: 125000,
        activeTenants: 15,
        occupancyRate: 85,
        collectionRate: 92,
        monthlyRevenue: [
          { month: 'Jan', amount: 45000 },
          { month: 'Feb', amount: 48000 },
          { month: 'Mar', amount: 52000 }
        ],
        recentTransactions: [
          { id: '1', transaction_date: new Date(), tenants: { name: 'John Doe' }, amount: 5000, payment_method: 'razorpay' }
        ]
      });
    }

    const adminId = req.admin.id;
    const { startDate, endDate } = req.query;

    // Total revenue
    const { data: paidBills } = await supabase
      .from('bills')
      .select('total_amount')
      .eq('admin_id', adminId)
      .eq('status', 'paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalRevenue = paidBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;

    // Active tenants
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id')
      .eq('admin_id', adminId)
      .eq('is_active', true);

    // Occupancy rate
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id, is_occupied')
      .eq('admin_id', adminId);

    const occupancyRate = rooms?.length ? Math.round((rooms.filter(r => r.is_occupied).length / rooms.length) * 100) : 0;

    // Collection rate
    const { data: allBills } = await supabase
      .from('bills')
      .select('status')
      .eq('admin_id', adminId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const collectionRate = allBills?.length ? Math.round((allBills.filter(b => b.status === 'paid').length / allBills.length) * 100) : 0;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const { data: monthBills } = await supabase
        .from('bills')
        .select('total_amount')
        .eq('admin_id', adminId)
        .eq('status', 'paid')
        .eq('billing_month', month)
        .eq('billing_year', year);
      
      const amount = monthBills?.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0) || 0;
      monthlyRevenue.push({
        month: date.toLocaleDateString('en', { month: 'short' }),
        amount
      });
    }

    // Recent transactions
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select(`
        id, amount, payment_method, transaction_date,
        tenants(name)
      `)
      .eq('admin_id', adminId)
      .order('transaction_date', { ascending: false })
      .limit(10);

    res.json({
      totalRevenue,
      activeTenants: tenants?.length || 0,
      occupancyRate,
      collectionRate,
      monthlyRevenue,
      recentTransactions: recentTransactions || []
    });
  } catch (error) {
    logError('Analytics error', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Generate payment report
router.get('/reports/payment', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(501).json({ error: 'Reports not available in demo mode' });
    }

    const { startDate, endDate } = req.query;
    const { generatePaymentReportPDF } = require('../utils/reportGenerator');

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, tenants(name), bills(bill_number)')
      .eq('admin_id', req.admin.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    const pdfBuffer = await generatePaymentReportPDF(transactions || [], { startDate, endDate });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="payment-report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    logError('Payment report generation error', error);
    res.status(500).json({ error: 'Failed to generate payment report' });
  }
});

module.exports = router;