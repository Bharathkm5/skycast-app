const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to req
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password -otp -otpExpires -otpAttempts');

    if (!user)          return res.status(401).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account has been blocked. Contact support.' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Require admin role (runs auth first)
const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user?.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

// Sign a JWT token
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

module.exports = { auth, adminAuth, signToken };
