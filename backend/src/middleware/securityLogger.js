const { supabase } = require('../../config/supabase');

// Security event types
const SECURITY_EVENTS = {
  FAILED_LOGIN: 'failed_login',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};

// Log security events
const logSecurityEvent = async (eventType, details, req = null) => {
  try {
    const logEntry = {
      event_type: eventType,
      details: JSON.stringify(details),
      ip_address: req ? (req.ip || req.connection.remoteAddress) : null,
      user_agent: req ? req.get('User-Agent') : null,
      timestamp: new Date().toISOString(),
      severity: getSeverityLevel(eventType)
    };

    // Log to database
    await supabase.from('security_logs').insert(logEntry);
    
    // Log to console for immediate visibility
    console.warn(`🚨 SECURITY EVENT: ${eventType}`, logEntry);
    
    // Alert for critical events
    if (logEntry.severity === 'critical') {
      await sendSecurityAlert(eventType, details);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Determine severity level
const getSeverityLevel = (eventType) => {
  const criticalEvents = [
    SECURITY_EVENTS.SQL_INJECTION_ATTEMPT,
    SECURITY_EVENTS.UNAUTHORIZED_ACCESS
  ];
  
  const highEvents = [
    SECURITY_EVENTS.ACCOUNT_LOCKED,
    SECURITY_EVENTS.XSS_ATTEMPT
  ];
  
  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  return 'medium';
};

// Send security alerts (implement email/SMS notifications)
const sendSecurityAlert = async (eventType, details) => {
  // Implement your alerting mechanism here
  console.error(`🚨 CRITICAL SECURITY ALERT: ${eventType}`, details);
};

// Middleware to log suspicious requests
const securityMonitor = (req, res, next) => {
  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript injection
    /vbscript:/gi, // VBScript injection
  ];
  
  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(requestData)
  );
  
  if (hasSuspiciousContent) {
    logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query
    }, req);
  }
  
  next();
};

module.exports = {
  logSecurityEvent,
  securityMonitor,
  SECURITY_EVENTS
};