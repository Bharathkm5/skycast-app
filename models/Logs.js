const mongoose = require('mongoose');

// ── Search Log ────────────────────────────────────────────────
const searchLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  userName:  String,
  query:     { type: String, required: true },
  city:      String,
  country:   String,
  lat:       Number,
  lon:       Number,
  ip:        String,
  userAgent: String,
}, { timestamps: true });

// ── Login / Auth Log ──────────────────────────────────────────
const loginLogSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  userName:  String,
  action: {
    type: String,
    enum: ['login', 'logout', 'register', 'otp_sent', 'otp_verified', 'otp_failed'],
    default: 'login',
  },
  success:  { type: Boolean, default: true },
  ip:       String,
  userAgent:String,
  details:  String,
}, { timestamps: true });

module.exports.SearchLog = mongoose.model('SearchLog', searchLogSchema);
module.exports.LoginLog  = mongoose.model('LoginLog',  loginLogSchema);
