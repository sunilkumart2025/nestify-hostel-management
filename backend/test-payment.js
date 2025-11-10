require('dotenv').config();
const { supabase } = require('./config/supabase');

async function testPaymentSystem() {
  console.log('🔍 Testing Payment System...\n');

  try {
    // 1. Check if there are any admins
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('id, name, email, razorpay_key_id, razorpay_key_secret')
      .limit(5);

    console.log('📊 Admins in database:', admins?.length || 0);
    if (admins?.length > 0) {
      console.log('   First admin:', admins[0].name, '- Razorpay configured:', !!(admins[0].razorpay_key_id));
    }

    // 2. Check if there are any tenants
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, email, admin_id')
      .limit(5);

    console.log('👥 Tenants in database:', tenants?.length || 0);
    if (tenants?.length > 0) {
      console.log('   First tenant:', tenants[0].name);
    }

    // 3. Check if there are any bills
    const { data: bills, error: billError } = await supabase
      .from('bills')
      .select('id, bill_number, tenant_id, admin_id, total_amount, status')
      .limit(5);

    console.log('📄 Bills in database:', bills?.length || 0);
    if (bills?.length > 0) {
      console.log('   First bill:', bills[0].bill_number, '- Status:', bills[0].status, '- Amount:', bills[0].total_amount);
    }

    // 4. If we have admin and tenant but no bills, create a test bill
    if (admins?.length > 0 && tenants?.length > 0 && (!bills || bills.length === 0)) {
      console.log('\n🔧 Creating test bill...');
      
      const { data: newBill, error: createError } = await supabase
        .from('bills')
        .insert({
          admin_id: admins[0].id,
          tenant_id: tenants[0].id,
          bill_number: 'BILL' + Date.now(),
          billing_month: new Date().getMonth() + 1,
          billing_year: new Date().getFullYear(),
          room_rent: 5000,
          electricity_charges: 300,
          water_charges: 200,
          total_amount: 5500,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test bill:', createError);
      } else {
        console.log('✅ Test bill created:', newBill.bill_number);
      }
    }

    // 5. Test payment order creation logic
    if (bills?.length > 0 || admins?.length > 0) {
      console.log('\n🧪 Testing payment order creation logic...');
      
      const testBill = bills?.[0];
      if (testBill && admins?.length > 0) {
        const admin = admins.find(a => a.id === testBill.admin_id) || admins[0];
        
        if (admin.razorpay_key_id && admin.razorpay_key_secret) {
          console.log('✅ Razorpay credentials found for admin');
          console.log('   Key ID:', admin.razorpay_key_id.substring(0, 10) + '...');
        } else {
          console.log('❌ Razorpay credentials missing for admin');
          console.log('   Need to configure Razorpay in admin profile');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentSystem();