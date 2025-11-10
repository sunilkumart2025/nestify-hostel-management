const { supabase } = require('../../config/supabase');

const logSecurityEvent = async (eventType, details, req = null) => {
  try {
    const logEntry = {
      event_type: eventType,
      details: JSON.stringify(details),
      ip_address: req ? req.ip : null,
      user_agent: req ? req.get('User-Agent') : null,
      severity: getSeverity(eventType)
    };

    // Use service role for security logging
    const { createClient } = require('@supabase/supabase-js');
    const serviceSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    await serviceSupabase.from('security_logs').insert(logEntry);
    console.warn(`🚨 SECURITY: ${eventType}`, details);
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

const getSeverity = (eventType) => {
  const critical = ['sql_injection', 'unauthorized_access'];
  const high = ['brute_force', 'account_locked'];
  
  if (critical.includes(eventType)) return 'critical';
  if (high.includes(eventType)) return 'high';
  return 'medium';
};

const logLoginAttempt = async (userId, userType, success, ip, userAgent, reason = null) => {
  try {
    // Use service role for login logging
    const { createClient } = require('@supabase/supabase-js');
    const serviceSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    await serviceSupabase.from('login_logs').insert({
      user_id: userId,
      user_type: userType,
      success,
      ip_address: ip,
      user_agent: userAgent,
      failure_reason: reason
    });
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

module.exports = {
  logSecurityEvent,
  logLoginAttempt
};