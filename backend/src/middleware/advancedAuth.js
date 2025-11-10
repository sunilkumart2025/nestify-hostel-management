const jwt = require('jsonwebtoken');
const { supabase } = require('../../config/supabase');

// Session store for active sessions
const activeSessions = new Map();

// Enhanced JWT middleware with session tracking
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check session validity
    const sessionKey = `${decoded.id}_${decoded.role}`;
    const session = activeSessions.get(sessionKey);
    
    if (session) {
      // Update last activity
      session.lastActivity = Date.now();
      
      // Check for session timeout (1 hour)
      const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_MS) || 3600000;
      if (Date.now() - session.lastActivity > sessionTimeout) {
        activeSessions.delete(sessionKey);
        return res.status(401).json({ error: 'Session expired' });
      }
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create session on login
const createSession = (userId, role, userAgent, ip) => {
  const sessionKey = `${userId}_${role}`;
  activeSessions.set(sessionKey, {
    userAgent,
    ip,
    createdAt: Date.now(),
    lastActivity: Date.now()
  });
};

// Destroy session on logout
const destroySession = (userId, role) => {
  const sessionKey = `${userId}_${role}`;
  activeSessions.delete(sessionKey);
};

module.exports = {
  authenticateToken,
  createSession,
  destroySession
};