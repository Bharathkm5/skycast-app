const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

// ─────────────────────────────────────────────
// GMAIL TRANSPORTER
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({

  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

});

// ─────────────────────────────────────────────
// GENERATE OTP
// ─────────────────────────────────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─────────────────────────────────────────────
// CREATE + SEND OTP
// ─────────────────────────────────────────────
const createAndSendOTP = async ({
  email,
  name,
  purpose = 'verify',
}) => {

  try {

    email = email.toLowerCase().trim();

    const otp = generateOTP();

    const expiryMins =
      parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

    const expiresAt = new Date(
      Date.now() + expiryMins * 60 * 1000
    );

    // remove old otp
    await Otp.deleteMany({
      email,
      purpose,
    });

    // save otp
    await Otp.create({
      email,
      otp,
      purpose,
      expiresAt,
    });

    console.log('📩 OTP GENERATED:', otp);

    // send email
    const info = await transporter.sendMail({

      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDR}>`,

      to: email,

      subject:
        purpose === 'verify'
          ? '🌤️ SkyCast Email Verification OTP'
          : '🔐 SkyCast Login OTP',

      html: `
        <div style="font-family:Arial;padding:20px">

          <h2>SkyCast OTP</h2>

          <p>Hello ${name || 'User'},</p>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing:4px;color:#2563eb">
            ${otp}
          </h1>

          <p>
            Expires in ${expiryMins} minutes.
          </p>

        </div>
      `,

      text: `Your OTP is ${otp}`,

    });

    console.log('✅ Email sent:', info.messageId);

    return true;

  } catch (err) {

    console.error('❌ EMAIL ERROR:', err);

    throw new Error(
      err.message || 'Failed to send OTP email'
    );
  }
};

module.exports = {
  createAndSendOTP,
};