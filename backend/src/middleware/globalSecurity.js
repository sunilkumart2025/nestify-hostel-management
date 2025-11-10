const { createClient } = require('@supabase/supabase-js');

// Use service role for global security operations
const serviceSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Global session tracking
const globalSessions = new Map(); // sessionToken -> sessionData
const MAX_GLOBAL_USERS = 500;

// Create global session
const createGlobalSession = async (userId, userType, email, hostelId, req) => {
  const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sessionData = {
    userId,
    userType,
    email,
    hostelId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    loginTime: new Date(),
    lastActivity: new Date()
  };

  // Store in memory
  globalSessions.set(sessionToken, sessionData);

  // Store in database
  try {
    const { error } = await serviceSupabase.from('platform_sessions').insert({
      user_id: userId,
      user_type: userType,
      user_email: email,
      hostel_id: hostelId,
      session_token: sessionToken,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      device_type: getDeviceType(req.get('User-Agent'))
    });
    if (error) console.error('Session logging failed:', error);
    else console.log('✅ Session created:', email);
  } catch (error) {
    console.error('Session creation error:', error);
  }

  return sessionToken;
};

// Check global capacity
const checkGlobalCapacity = async (req, res, next) => {
  const activeCount = globalSessions.size;
  
  if (activeCount >= MAX_GLOBAL_USERS) {
    await logSecurityEvent('CAPACITY_EXCEEDED', {
      currentSessions: activeCount,
      maxSessions: MAX_GLOBAL_USERS,
      rejectedUser: req.body.email
    }, req);
    
    return res.status(503).json({
      error: 'Platform at maximum capacity. Please try again later.',
      currentUsers: activeCount,
      maxUsers: MAX_GLOBAL_USERS
    });
  }
  
  next();
};

// Log global login attempt
const logGlobalLoginAttempt = async (email, userType, success, hostelId, req, reason = null) => {
  try {
    const { error } = await serviceSupabase.from('platform_login_attempts').insert({
      email,
      user_type: userType,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      success,
      failure_reason: reason,
      hostel_id: hostelId
    });
    if (error) console.error('Login attempt logging failed:', error);
    else console.log('✅ Login attempt logged:', email, success);
  } catch (error) {
    console.error('Login attempt logging error:', error);
  }
};

// Log global security event
const logSecurityEvent = async (eventType, details, req, userId = null, email = null, hostelId = null) => {
  try {
    const { error } = await serviceSupabase.from('platform_security_events').insert({
      event_type: eventType,
      severity: getSeverity(eventType),
      user_id: userId,
      user_email: email,
      hostel_id: hostelId,
      ip_address: req ? req.ip : null,
      user_agent: req ? req.get('User-Agent') : null,
      details: JSON.stringify(details)
    });
    if (error) console.error('Security event logging failed:', error);
    else console.log('🚨 Security event logged:', eventType);
  } catch (error) {
    console.error('Security event logging error:', error);
  }
};

// Remove global session
const removeGlobalSession = async (sessionToken) => {
  globalSessions.delete(sessionToken);
  
  await serviceSupabase
    .from('platform_sessions')
    .update({ is_active: false })
    .eq('session_token', sessionToken);
};

// Get global statistics
const getGlobalStats = async () => {
  const activeSessions = globalSessions.size;
  
  // Get today's stats from database
  const today = new Date().toISOString().split('T')[0];
  const { data: todayStats } = await serviceSupabase
    .from('platform_login_attempts')
    .select('success')
    .gte('created_at', `${today}T00:00:00Z`);

  const failedLogins = todayStats?.filter(attempt => !attempt.success).length || 0;
  const successfulLogins = todayStats?.filter(attempt => attempt.success).length || 0;

  return {
    activeSessions,
    maxSessions: MAX_GLOBAL_USERS,
    availableSlots: MAX_GLOBAL_USERS - activeSessions,
    failedLoginsToday: failedLogins,
    successfulLoginsToday: successfulLogins,
    capacityPercentage: (activeSessions / MAX_GLOBAL_USERS) * 100
  };
};

// Helper functions
const getSeverity = (eventType) => {
  const critical = ['CAPACITY_EXCEEDED', 'MULTIPLE_FAILED_LOGINS', 'SUSPICIOUS_ACTIVITY'];
  const high = ['BRUTE_FORCE_DETECTED', 'ACCOUNT_LOCKED'];
  
  if (critical.includes(eventType)) return 'critical';
  if (high.includes(eventType)) return 'high';
  return 'medium';
};

const getDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
};

// Cleanup inactive sessions
const cleanupInactiveSessions = async () => {
  const now = new Date();
  const timeout = 60 * 60 * 1000; // 1 hour

  for (const [token, session] of globalSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      await removeGlobalSession(token);
    }
  }
};

setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  createGlobalSession,
  checkGlobalCapacity,
  logGlobalLoginAttempt,
  logSecurityEvent,
  removeGlobalSession,
  getGlobalStats
};