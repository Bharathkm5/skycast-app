const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,   // ✅ FIX (important)
    trim: true,
  },

  otp: {
    type: String,
    required: true,
    trim: true,        // ✅ FIX
  },

  purpose: {
    type: String,
    enum: ['verify', 'login'],
    default: 'verify',
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔥 AUTO DELETE after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);