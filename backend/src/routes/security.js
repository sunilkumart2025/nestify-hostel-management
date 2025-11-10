const express = require('express');
const { supabase } = require('../../config/supabase');
const { authenticateToken } = require('../auth/middleware');
const { getSessionStats } = require('../middleware/concurrencyControl');

const router = express.Router();

// Get security logs (admin only)
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: logs, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security logs' });
  }
});

// Get login attempts
router.get('/login-attempts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: attempts, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ attempts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
});

// Security dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Failed logins today
    const { count: failedLogins } = await supabase
      .from('login_logs')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('created_at', today.toISOString());

    // Security events today
    const { count: securityEvents } = await supabase
      .from('security_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const sessionStats = getSessionStats();

    res.json({
      failedLoginsToday: failedLogins || 0,
      securityEventsToday: securityEvents || 0,
      ...sessionStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

module.exports = router;