const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { SearchLog } = require('../models/Logs');
const { auth }  = require('../middleware/auth');

// POST /api/search/log — called on every city search
router.post('/log', auth, async (req, res) => {
  try {
    const { query, city, country, lat, lon } = req.body;
    await SearchLog.create({
      user: req.user._id, userEmail: req.user.email, userName: req.user.name,
      query, city, country, lat, lon,
      ip: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent'],
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { searchHistory: { $each: [{ query: city || query, city, country, lat, lon }], $slice: -50, $position: 0 } },
      lastActive: new Date(),
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/search/history
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('searchHistory');
    res.json(user?.searchHistory || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/search/history
router.delete('/history', auth, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { searchHistory: [] });
  res.json({ success: true });
});

module.exports = router;
