const OTP = require('../models/otp.model');
const { generateOTP, sendOTPEmail } = require('../utils/mailer');

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;

// ✅ SEND OTP
const sendOTP = async (email, name, purpose = 'verify') => {
  const otp = generateOTP();

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

  // remove old OTP
  await OTP.deleteMany({ email, purpose });

  // save new OTP
  await OTP.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  // send email
  await sendOTPEmail({
    to: email,
    name,
    otp,
    purpose,
  });

  return { success: true };
};

// ✅ VERIFY OTP
const verifyOTP = async (email, otp, purpose = 'verify') => {
  const record = await OTP.findOne({ email, purpose });

  if (!record) {
    throw new Error('OTP not found');
  }

  // expired check
  if (record.expiresAt < new Date()) {
    await OTP.deleteMany({ email, purpose });
    throw new Error('OTP expired');
  }

  // attempt limit
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error('Too many attempts');
  }

  // wrong OTP
  if (record.otp !== otp) {
    record.attempts += 1;
    await record.save();
    throw new Error('Invalid OTP');
  }

  // success → delete OTP
  await OTP.deleteMany({ email, purpose });

  return { success: true };
};

// ✅ RESEND OTP
const resendOTP = async (email, name, purpose = 'verify') => {
  return sendOTP(email, name, purpose);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};