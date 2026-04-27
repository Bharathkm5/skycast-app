const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const { SearchLog, LoginLog } = require('../models/Logs');
const { adminAuth } = require('../middleware/auth');

router.use(adminAuth);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const week  = new Date(Date.now() - 7 * 86400000);
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    const [totalUsers, verifiedUsers, blockedUsers, adminCount, todayUsers, weekUsers,
           totalSearches, todaySearches, totalLogins, todayLogins, activeNow,
           topCities, regPerDay, searchPerDay] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', verified: true }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      SearchLog.countDocuments(),
      SearchLog.countDocuments({ createdAt: { $gte: today } }),
      LoginLog.countDocuments({ action: 'otp_verified' }),
      LoginLog.countDocuments({ action: 'otp_verified', createdAt: { $gte: today } }),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 900000) } }),
      SearchLog.aggregate([{ $group: { _id: '$city', count: { $sum: 1 }, country: { $first: '$country' } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      User.aggregate([{ $match: { createdAt: { $gte: week } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      SearchLog.aggregate([{ $match: { createdAt: { $gte: week } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    ]);

    res.json({
      users:    { total: totalUsers, verified: verifiedUsers, blocked: blockedUsers, admins: adminCount, today: todayUsers, week: weekUsers },
      searches: { total: totalSearches, today: todaySearches },
      logins:   { total: totalLogins, today: todayLogins },
      activeNow, topCities,
      charts:   { regPerDay, searchPerDay },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', sort = '-createdAt', role = '', status = '' } = req.query;
    const q = {};
    if (search) q.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) q.role = role;
    if (status === 'blocked')    q.isBlocked = true;
    if (status === 'verified')   { q.verified = true; q.isBlocked = { $ne: true }; }
    if (status === 'unverified') q.verified = false;

    const total = await User.countDocuments(q);
    const users = await User.find(q).select('-password -otp -otpExpires -otpAttempts')
      .sort(sort).skip((page - 1) * limit).limit(parseInt(limit));

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user    = await User.findById(req.params.id).select('-password -otp -otpExpires -otpAttempts');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [searches, logins] = await Promise.all([
      SearchLog.find({ user: user._id }).sort('-createdAt').limit(20),
      LoginLog.find({ user: user._id }).sort('-createdAt').limit(20),
    ]);
    res.json({ user: user.toPublicJSON(), searches, logins });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
    res.json({ message: `${user.name} blocked`, user: user.toPublicJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id/unblock
router.put('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    res.json({ message: `${user.name} unblocked`, user: user.toPublicJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ message: `Role updated to ${role}`, user: user.toPublicJSON() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await SearchLog.deleteMany({ user: req.params.id });
    await LoginLog.deleteMany({ user: req.params.id });
    res.json({ message: `${user.name} permanently deleted` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/searches
router.get('/searches', async (req, res) => {
  try {
    const { page = 1, limit = 30, city = '' } = req.query;
    const q = city ? { city: { $regex: city, $options: 'i' } } : {};
    const total    = await SearchLog.countDocuments(q);
    const searches = await SearchLog.find(q).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ searches, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/logins
router.get('/logins', async (req, res) => {
  try {
    const { page = 1, limit = 30, action = '' } = req.query;
    const q = action ? { action } : {};
    const total  = await LoginLog.countDocuments(q);
    const logins = await LoginLog.find(q).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ logins, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
