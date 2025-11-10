const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase } = require('../../config/supabase');

// Session store for refresh tokens
const activeSessions = new Map();

// Generate secure refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Enhanced JWT middleware with refresh token support
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session is still active
    const sessionKey = `${decoded.id}_${decoded.role}`;
    if (!activeSessions.has(sessionKey)) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Update last activity
    activeSessions.get(sessionKey).lastActivity = Date.now();
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create secure session
const createSession = (userId, role, userAgent, ip) => {
  const accessToken = jwt.sign(
    { id: userId, role, sessionId: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = generateRefreshToken();
  const sessionKey = `${userId}_${role}`;
  
  activeSessions.set(sessionKey, {
    refreshToken,
    userAgent,
    ip,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return { accessToken, refreshToken };
};

// Refresh token endpoint
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken, userId, role } = req.body;
    const sessionKey = `${userId}_${role}`;
    
    const session = activeSessions.get(sessionKey);
    if (!session || session.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (Date.now() > session.expiresAt) {
      activeSessions.delete(sessionKey);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: userId, role, sessionId: crypto.randomUUID() },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    session.lastActivity = Date.now();
    
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// Logout and invalidate session
const logout = (req, res) => {
  const sessionKey = `${req.user.id}_${req.user.role}`;
  activeSessions.delete(sessionKey);
  res.json({ message: 'Logged out successfully' });
};

// Clean expired sessions
const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [key, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(key);
    }
  }
};

// Run cleanup every hour
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
  authenticateToken,
  createSession,
  refreshAccessToken,
  logout,
  cleanExpiredSessions
};