const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { LoginLog } = require('../models/Logs');
const { signToken, auth } = require('../middleware/auth');

// ─────────────────────────────────────────────
// LOG FUNCTION
// ─────────────────────────────────────────────
const logEvent = async (
  action,
  user,
  req,
  details = '',
  success = true
) => {

  try {

    await LoginLog.create({
      user: user?._id,
      userEmail: user?.email,
      userName: user?.name,
      action,
      success,
      details,
      ip: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent'],
    });

  } catch (_) {}
};

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {

  try {

    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {

      return res.status(400).json({
        error: 'All fields required',
      });
    }

    // existing user check
    const existing = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existing) {

      return res.status(409).json({
        error: 'Email already registered',
      });
    }

    // create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      verified: true,
      lastLogin: new Date(),
      loginCount: 1,
    });

    await user.save();

    // create jwt
    const token = signToken(user._id);

    // log
    await logEvent(
      'register',
      user,
      req,
      'User registered successfully'
    );

    // response
    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toPublicJSON(),
    });

  } catch (err) {

    console.error('REGISTER ERROR:', err);

    res.status(500).json({
      error: err.message || 'Registration failed',
    });
  }
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {

  try {

    const { email, password } = req.body;

    // find user
    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {

      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // compare password
    const match = await user.comparePassword(password);

    if (!match) {

      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // update login info
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    // create token
    const token = signToken(user._id);

    // log
    await logEvent(
      'login',
      user,
      req,
      'User logged in successfully'
    );

    // response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON(),
    });

  } catch (err) {

    console.error('LOGIN ERROR:', err);

    res.status(500).json({
      error: err.message || 'Login failed',
    });
  }
});

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {

  try {

    const user = await User.findById(req.user._id)
      .select('-password');

    res.json(user.toPublicJSON());

  } catch (err) {

    console.error('PROFILE ERROR:', err);

    res.status(500).json({
      error: 'Failed to load profile',
    });
  }
});

module.exports = router;