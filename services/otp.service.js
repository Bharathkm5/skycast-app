const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

const OTP_EXPIRY_MINUTES =
  parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

// ─────────────────────────────────────────────
// Gmail Transport
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────────
// Generate OTP
// ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─────────────────────────────────────────────
// Send OTP
// ─────────────────────────────────────────────
async function createAndSendOTP({
  email,
  name,
  purpose = 'verify',
}) {
  email = email.toLowerCase().trim();

  // delete old otp
  await Otp.deleteMany({ email, purpose });

  const otp = generateOTP();

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  // save otp
  await Otp.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  // send mail
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDR}>`,
    to: email,
    subject: '🌤️ SkyCast OTP Verification',
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>SkyCast Verification</h2>

        <p>Hello ${name || 'User'},</p>

        <p>Your OTP code is:</p>

        <h1 style="letter-spacing:4px">${otp}</h1>

        <p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
      </div>
    `,
  });

  console.log('📧 OTP SENT:', otp);

  return true;
}

module.exports = {
  createAndSendOTP,
};