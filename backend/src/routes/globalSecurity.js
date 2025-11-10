const express = require('express');
const { authenticateToken } = require('../auth/middleware');
const { getGlobalStats } = require('../middleware/globalSecurity');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Use service role for global queries
const serviceSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Global platform statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const globalStats = await getGlobalStats();
    res.json(globalStats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

// Global login attempts
router.get('/login-attempts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: attempts } = await serviceSupabase
      .from('platform_login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    res.json({ attempts: attempts || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch login attempts' });
  }
});

// Active sessions across platform
router.get('/active-sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: sessions } = await serviceSupabase
      .from('platform_sessions')
      .select('*')
      .eq('is_active', true)
      .order('login_time', { ascending: false });

    res.json({ sessions: sessions || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// Security events
router.get('/security-events', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { data: events } = await serviceSupabase
      .from('platform_security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    res.json({ events: events || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Platform overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get counts from different tables
    const { count: totalAdmins } = await serviceSupabase
      .from('admins')
      .select('*', { count: 'exact', head: true });

    const { count: totalTenants } = await serviceSupabase
      .from('tenants')
      .select('*', { count: 'exact', head: true });

    const { count: activeSessions } = await serviceSupabase
      .from('platform_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const globalStats = await getGlobalStats();

    res.json({
      totalAdmins: totalAdmins || 0,
      totalTenants: totalTenants || 0,
      activeSessions: activeSessions || 0,
      ...globalStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform overview' });
  }
});

module.exports = router;