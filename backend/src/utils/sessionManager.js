const { supabase } = require('../../config/supabase');
const jwt = require('jsonwebtoken');

const MAX_CONCURRENT_USERS = 500;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class SessionManager {
  static async canCreateSession() {
    try {
      const { data } = await supabase.rpc('get_active_session_count');
      return (data || 0) < MAX_CONCURRENT_USERS;
    } catch (error) {
      console.error('Error checking session count:', error);
      // If session table doesn't exist, allow login (fallback)
      return true;
    }
  }

  static async createSession(userId, userType, ipAddress, userAgent) {
    try {
      // Check if we can create new session
      const canCreate = await this.canCreateSession();
      if (!canCreate) {
        throw new Error('Maximum concurrent users reached. Please try again later.');
      }

      // Terminate existing sessions for this user
      await this.terminateUserSessions(userId);

      // Generate session token
      const sessionToken = jwt.sign(
        { userId, userType, sessionId: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const expiresAt = new Date(Date.now() + SESSION_DURATION);

      try {
        // Create new session
        const { data, error } = await supabase
          .from('active_sessions')
          .insert({
            user_id: userId,
            user_type: userType,
            session_token: sessionToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return {
          sessionToken,
          sessionId: data.id,
          expiresAt
        };
      } catch (dbError) {
        console.error('Session table error, using fallback:', dbError);
        // Fallback: return token without session tracking
        return {
          sessionToken,
          sessionId: 'fallback-' + Date.now(),
          expiresAt
        };
      }
    } catch (error) {
      throw error;
    }
  }

  static async validateSession(sessionToken) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

      try {
        // Check session in database
        const { data: session, error } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error || !session) {
          // Fallback to JWT validation only
          return {
            userId: decoded.userId,
            userType: decoded.userType,
            sessionId: decoded.sessionId || 'fallback'
          };
        }

        // Update last activity
        await supabase
          .from('active_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', session.id);

        return {
          userId: session.user_id,
          userType: session.user_type,
          sessionId: session.id
        };
      } catch (dbError) {
        console.error('Session validation DB error, using JWT fallback:', dbError);
        // Fallback to JWT validation only
        return {
          userId: decoded.userId,
          userType: decoded.userType,
          sessionId: decoded.sessionId || 'fallback'
        };
      }
    } catch (error) {
      return null;
    }
  }

  static async terminateSession(sessionToken) {
    try {
      await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
      
      return true;
    } catch (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }

  static async terminateUserSessions(userId) {
    try {
      await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);
      
      return true;
    } catch (error) {
      console.error('Error terminating user sessions:', error);
      return false;
    }
  }

  static async getActiveSessionCount() {
    try {
      const { data } = await supabase.rpc('get_active_session_count');
      return data || 0;
    } catch (error) {
      console.error('Error getting session count:', error);
      return 0;
    }
  }

  static async cleanupExpiredSessions() {
    try {
      const { data } = await supabase.rpc('cleanup_expired_sessions');
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }
}

module.exports = SessionManager;