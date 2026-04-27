const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

// ── Transporter ─────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

// ── Generate OTP ────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── MAIN FUNCTION ───────────────────────────
const createAndSendOTP = async ({ email, name, purpose = 'verify' }) => {
  const transporter = createTransporter();

  email = email.toLowerCase().trim(); // ✅ FIX

  const expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

  // 🔍 Check existing OTP
  const existing = await Otp.findOne({ email, purpose });

  // ⏱️ COOLDOWN (60 sec)
  if (existing) {
    const diff = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;

    if (diff < 60) {
      throw new Error(`Wait ${Math.ceil(60 - diff)} seconds before retry`);
    }

    // 🔁 Reuse OTP if still valid
    if (existing.expiresAt > new Date()) {
      console.log("📩 Reusing OTP:", existing.otp); // ✅ DEBUG

      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDR}>`,
        to: email,
        subject: '🔐 SkyCast — Your OTP',
        html: `
          <h2>SkyCast OTP</h2>
          <p>Hello ${name || 'User'},</p>
          <h1>${existing.otp}</h1>
          <p>Expires in ${expiryMins} minutes</p>
        `,
        text: `Your OTP is ${existing.otp}`,
      });

      return true;
    }

    // ❌ Expired → delete
    await Otp.deleteMany({ email, purpose });
  }

  // 🆕 Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);

  await Otp.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  console.log("📩 New OTP:", otp); // ✅ DEBUG

  // 📧 Send email
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDR}>`,
      to: email,
      subject:
        purpose === 'verify'
          ? '🌤️ SkyCast — Verify Your Email'
          : '🔐 SkyCast — Your Login OTP',
      html: `
        <h2>SkyCast OTP</h2>
        <p>Hello ${name || 'User'},</p>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Expires in ${expiryMins} minutes.</p>
      `,
      text: `Your OTP is ${otp}`,
    });
  } catch (err) {
    console.error("❌ Email send failed:", err.message);

    // 👉 fallback (VERY IMPORTANT FOR TESTING)
    return { devOtp: otp };
  }

  return true;
};

module.exports = {
  createAndSendOTP,
};