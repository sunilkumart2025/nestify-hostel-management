const { supabase } = require('../../config/supabase');

// Manual cleanup function for security logs
const cleanupSecurityLogs = async () => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Clean old security logs
    await supabase
      .from('security_logs')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    // Clean old login logs
    await supabase
      .from('login_logs')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    // Clean expired sessions
    await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    console.log('✅ Security logs cleanup completed');
  } catch (error) {
    console.error('❌ Security logs cleanup failed:', error);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupSecurityLogs, 24 * 60 * 60 * 1000);

module.exports = { cleanupSecurityLogs };