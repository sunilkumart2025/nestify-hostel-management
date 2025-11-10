const express = require('express');
const { destroySession } = require('../middleware/advancedAuth');
const { authenticateToken } = require('../auth/middleware');
const { removeConcurrentSession } = require('../middleware/concurrencyControl');

const router = express.Router();

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const userKey = `${req.user.email}_${req.user.role}`;
    destroySession(req.user.id, req.user.role);
    removeConcurrentSession(userKey);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;