const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  verified: { type: Boolean, default: false },

  // OTP
  otp:         String,
  otpExpires:  Date,
  otpAttempts: { type: Number, default: 0 },

  // Preferences
  unit:        { type: String, enum: ['metric', 'imperial'], default: 'metric' },
  defaultCity: { name: String, lat: Number, lon: Number },
  savedCities: [{ name: String, lat: Number, lon: Number }],

  // Activity
  lastLogin:  Date,
  loginCount: { type: Number, default: 0 },
  lastActive: Date,

  // Search history (last 50)
  searchHistory: [{
    query:     String,
    city:      String,
    country:   String,
    lat:       Number,
    lon:       Number,
    timestamp: { type: Date, default: Date.now },
  }],

  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Strip sensitive fields for API responses
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.otpAttempts;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
