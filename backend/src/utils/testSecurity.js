// Test security logging
const { createClient } = require('@supabase/supabase-js');

const serviceSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testSecurityLogging = async () => {
  console.log('🧪 Testing security logging...');
  
  try {
    // Test platform_security_events
    const { error: eventError } = await serviceSupabase
      .from('platform_security_events')
      .insert({
        event_type: 'TEST_EVENT',
        severity: 'medium',
        details: JSON.stringify({ test: true })
      });
    
    if (eventError) {
      console.error('❌ Security events test failed:', eventError);
    } else {
      console.log('✅ Security events logging works');
    }
    
    // Test platform_login_attempts
    const { error: loginError } = await serviceSupabase
      .from('platform_login_attempts')
      .insert({
        email: 'test@example.com',
        user_type: 'admin',
        success: true
      });
    
    if (loginError) {
      console.error('❌ Login attempts test failed:', loginError);
    } else {
      console.log('✅ Login attempts logging works');
    }
    
    // Test platform_sessions
    const { error: sessionError } = await serviceSupabase
      .from('platform_sessions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        user_type: 'admin',
        user_email: 'test@example.com',
        session_token: 'test_token_' + Date.now()
      });
    
    if (sessionError) {
      console.error('❌ Sessions test failed:', sessionError);
    } else {
      console.log('✅ Sessions logging works');
    }
    
  } catch (error) {
    console.error('❌ Security test error:', error);
  }
};

module.exports = { testSecurityLogging };