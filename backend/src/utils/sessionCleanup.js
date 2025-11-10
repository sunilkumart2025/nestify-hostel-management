const SessionManager = require('./sessionManager');

class SessionCleanup {
  static startCleanupJob() {
    // Run cleanup every 15 minutes
    setInterval(async () => {
      try {
        const cleaned = await SessionManager.cleanupExpiredSessions();
        if (cleaned > 0) {
          console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
        }
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes

    console.log('📅 Session cleanup job started (runs every 15 minutes)');
  }

  static async forceCleanup() {
    try {
      const cleaned = await SessionManager.cleanupExpiredSessions();
      console.log(`🧹 Force cleanup completed: ${cleaned} sessions removed`);
      return cleaned;
    } catch (error) {
      console.error('Force cleanup error:', error);
      return 0;
    }
  }
}

module.exports = SessionCleanup;