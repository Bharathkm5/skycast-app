const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { LoginLog } = require('../models/Logs');
const { signToken, auth } = require('../middleware/auth');

const Otp = require('../models/Otp');

// ✅ FIXED IMPORT
const { createAndSendOTP } = require('../services/otp.service');

const MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;

// ───────── LOG FUNCTION ─────────
const logEvent = async (action, user, req, details = '', success = true) => {
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

// ───────── REGISTER ─────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields required',
      });
    }

    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (user && user.verified) {
      return res.status(409).json({
        error: 'Email already registered',
      });
    }

    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        password,
      });

      await user.save();
    }

    // ✅ SEND OTP
    await createAndSendOTP({
      email: user.email,
      name: user.name,
      purpose: 'verify',
    });

    await logEvent(
      'otp_sent',
      user,
      req,
      'Register OTP sent'
    );

    res.json({
      success: true,
      message: 'OTP sent to email',
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);

    res.status(500).json({
      error: err.message || 'Registration failed',
    });
  }
});

// ───────── LOGIN ─────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    await createAndSendOTP({
      email: user.email,
      name: user.name,
      purpose: 'login',
    });

    await logEvent(
      'otp_sent',
      user,
      req,
      'Login OTP sent'
    );

    res.json({
      success: true,
      message: 'OTP sent',
      requiresOtp: true,
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);

    res.status(500).json({
      error: err.message || 'Login failed',
    });
  }
});

// ───────── VERIFY OTP ─────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await Otp.findOne({ email });

    if (!record) {
      return res.status(400).json({
        error: 'No OTP found',
      });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many attempts',
      });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'OTP expired',
      });
    }

    if (record.otp !== otp) {
      record.attempts += 1;

      await record.save();

      return res.status(400).json({
        error: 'Invalid OTP',
      });
    }

    await Otp.deleteMany({ email });

    const user = await User.findOne({ email });

    user.verified = true;
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Verified successfully',
      token,
      user: user.toPublicJSON(),
    });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);

    res.status(500).json({
      error: err.message || 'OTP verification failed',
    });
  }
});

// ───────── RESEND OTP ─────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    await createAndSendOTP({
      email: user.email,
      name: user.name,
      purpose: 'verify',
    });

    res.json({
      success: true,
      message: 'OTP resent successfully',
    });

  } catch (err) {
    console.error('RESEND OTP ERROR:', err);

    res.status(500).json({
      error: err.message || 'Resend failed',
    });
  }
});

// ───────── PROFILE ─────────
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password');

  res.json(user.toPublicJSON());
});

module.exports = router;