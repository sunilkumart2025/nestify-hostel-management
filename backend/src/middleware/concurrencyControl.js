// Global session tracking
const activeSessions = new Map(); // userId_role -> sessionData
const waitingQueue = []; // Array of waiting requests
const MAX_CONCURRENT_USERS = 500;

// Check if user can login
const checkConcurrency = (req, res, next) => {
  const { email } = req.body;
  const userKey = `${email}_${req.path.includes('admin') ? 'admin' : 'tenant'}`;
  
  // Check if user already has active session
  if (activeSessions.has(userKey)) {
    return res.status(409).json({ 
      error: 'Account already logged in elsewhere. Please logout first.' 
    });
  }
  
  // Check if we're at capacity
  if (activeSessions.size >= MAX_CONCURRENT_USERS) {
    return res.status(503).json({ 
      error: 'Server at capacity. Please try again later.',
      waitingPosition: waitingQueue.length + 1
    });
  }
  
  req.userKey = userKey;
  next();
};

// Create session after successful login
const createConcurrentSession = (userKey, userId, role, ip, userAgent) => {
  activeSessions.set(userKey, {
    userId,
    role,
    ip,
    userAgent,
    loginTime: Date.now(),
    lastActivity: Date.now()
  });
};

// Remove session on logout
const removeConcurrentSession = (userKey) => {
  activeSessions.delete(userKey);
  processWaitingQueue();
};

// Process waiting queue (placeholder for future implementation)
const processWaitingQueue = () => {
  // Could notify waiting users that space is available
  console.log(`Sessions: ${activeSessions.size}/${MAX_CONCURRENT_USERS}`);
};

// Get session stats
const getSessionStats = () => ({
  activeSessions: activeSessions.size,
  maxSessions: MAX_CONCURRENT_USERS,
  availableSlots: MAX_CONCURRENT_USERS - activeSessions.size
});

// Cleanup inactive sessions (run periodically)
const cleanupInactiveSessions = () => {
  const now = Date.now();
  const timeout = 60 * 60 * 1000; // 1 hour
  
  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      activeSessions.delete(key);
    }
  }
};

setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  checkConcurrency,
  createConcurrentSession,
  removeConcurrentSession,
  getSessionStats
};