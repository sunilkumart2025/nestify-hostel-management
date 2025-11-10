const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { supabase } = require('../../config/supabase');
const { authenticateToken, requireTenant } = require('../auth/middleware');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { logInfo, logError, logSuccess } = require('../utils/logger');

const router = express.Router();
const isDemoMode = !process.env.SUPABASE_URL || process.env.SUPABASE_URL === 'https://your-project.supabase.co';

// Create payment order
router.post('/create-order', authenticateToken, requireTenant, async (req, res) => {
  try {
    const { billId } = req.body;
    const tenantId = req.tenant.id;

    if (!billId) {
      return res.status(400).json({ error: 'Bill ID is required' });
    }

    logInfo('Payment order request', { billId, tenantId, isDemoMode });

    if (isDemoMode) {
      logInfo('Demo payment order created', { billId, tenantId });
      return res.json({
        orderId: 'order_demo_' + Date.now(),
        amount: 550000,
        currency: 'INR',
        keyId: 'rzp_test_demo'
      });
    }

    // First, get the bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('id, total_amount, status, admin_id')
      .eq('id', billId)
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .single();

    if (billError) {
      logError('Bill query error', { billError, billId, tenantId });
      return res.status(404).json({ error: 'Bill not found or already paid' });
    }

    if (!bill) {
      logError('Bill not found', { billId, tenantId });
      return res.status(404).json({ error: 'Bill not found or already paid' });
    }

    // Get admin's Razorpay credentials
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('razorpay_key_id, razorpay_key_secret')
      .eq('id', bill.admin_id)
      .single();

    if (adminError || !admin) {
      logError('Admin query error', { adminError, adminId: bill.admin_id });
      return res.status(400).json({ error: 'Payment gateway configuration not found' });
    }

    if (!admin.razorpay_key_id || !admin.razorpay_key_secret) {
      logError('Razorpay credentials missing', { adminId: bill.admin_id });
      return res.status(400).json({ error: 'Payment gateway not configured by hostel admin' });
    }

    // Initialize Razorpay with admin's credentials
    const razorpay = new Razorpay({
      key_id: admin.razorpay_key_id,
      key_secret: admin.razorpay_key_secret
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(bill.total_amount) * 100), // Convert to paise
      currency: 'INR',
      receipt: `B${Date.now()}`, // Short receipt under 40 chars
      notes: {
        bill_id: billId,
        tenant_id: tenantId
      }
    });

    logSuccess('Payment order created', { orderId: order.id, billId, tenantId, amount: order.amount });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: admin.razorpay_key_id
    });
  } catch (error) {
    const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
    console.error('Payment order creation failed:', error);
    logError('Create order error', { 
      error: errorMessage, 
      stack: error?.stack, 
      billId: req.body?.billId
    });
    res.status(500).json({ error: 'Failed to create payment order: ' + errorMessage });
  }
});

// Verify payment
router.post('/verify', authenticateToken, requireTenant, async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({
        success: true,
        transactionId: 'txn_demo_' + Date.now(),
        message: 'Payment verified successfully (demo mode)'
      });
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, billId } = req.body;
    const tenantId = req.tenant.id;

    // Get bill details
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('id, total_amount, admin_id')
      .eq('id', billId)
      .eq('tenant_id', tenantId)
      .single();

    if (billError || !bill) {
      logError('Bill not found for verification', { billError, billId, tenantId });
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Get admin's Razorpay secret
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('razorpay_key_secret')
      .eq('id', bill.admin_id)
      .single();

    if (adminError || !admin || !admin.razorpay_key_secret) {
      logError('Admin Razorpay secret not found', { adminError, adminId: bill.admin_id });
      return res.status(400).json({ error: 'Payment verification failed - configuration error' });
    }

    // Verify signature
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', admin.razorpay_key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logError('Invalid payment signature', { billId, razorpayPaymentId });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update bill status
    const { error: updateBillError } = await supabase
      .from('bills')
      .update({ status: 'paid' })
      .eq('id', billId);

    if (updateBillError) throw updateBillError;

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        bill_id: billId,
        admin_id: bill.admin_id,
        tenant_id: tenantId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        amount: bill.total_amount,
        payment_method: 'razorpay',
        payment_status: 'success'
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    logSuccess('Payment verified successfully', { 
      billId, 
      razorpayPaymentId, 
      tenantId, 
      amount: bill.total_amount 
    });

    res.json({
      success: true,
      transactionId: transaction.id,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    logError('Verify payment error', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Download invoice
router.get('/invoice/:billId', authenticateToken, requireTenant, async (req, res) => {
  try {
    if (isDemoMode) {
      return res.status(501).json({ 
        error: 'PDF generation not available in demo mode. Database connection required.' 
      });
    }

    const { billId } = req.params;
    const tenantId = req.tenant.id;

    // Get bill details
    const { data: bill, error } = await supabase
      .from('bills')
      .select(`
        id, bill_number, billing_month, billing_year,
        room_rent, electricity_charges, water_charges,
        maintenance_charges, internet_charges, other_charges,
        total_amount, status, created_at, admin_id, room_id
      `)
      .eq('id', billId)
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .single();

    if (error || !bill) {
      return res.status(404).json({ error: 'Paid bill not found' });
    }

    // Get related data
    const [roomResult, adminResult, tenantResult, transactionResult] = await Promise.all([
      supabase.from('rooms').select('room_number').eq('id', bill.room_id).single(),
      supabase.from('admins').select('hostel_name, hostel_address, phone, email').eq('id', bill.admin_id).single(),
      supabase.from('tenants').select('name, registration_id, phone').eq('id', tenantId).single(),
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

    logSuccess('Invoice downloaded', { billId, tenantId });
  } catch (error) {
    logError('Download invoice error', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// Webhook for payment status updates
router.post('/webhook', async (req, res) => {
  try {
    if (isDemoMode) {
      return res.json({ status: 'ok' });
    }

    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (expectedSignature !== webhookSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ payment_status: 'success' })
        .eq('razorpay_payment_id', paymentEntity.id);

      logSuccess('Payment captured via webhook', { paymentId: paymentEntity.id });
    } else if (event === 'payment.failed') {
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ payment_status: 'failed' })
        .eq('razorpay_payment_id', paymentEntity.id);

      logError('Payment failed via webhook', { paymentId: paymentEntity.id });
    }

    res.json({ status: 'ok' });
  } catch (error) {
    logError('Webhook error', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;