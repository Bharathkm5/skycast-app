const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');

// ─────────────────────────────────────────────
// TRANSPORTER
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
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

  email = email.toLowerCase().trim();

  const otp = generateOTP();

  const expiryMins =
    parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

  const expiresAt = new Date(
    Date.now() + expiryMins * 60 * 1000
  );

  // remove old OTP
  await Otp.deleteMany({
    email,
    purpose,
  });

  // save new OTP
  await Otp.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  console.log('📩 OTP:', otp);

  // verify smtp
  await transporter.verify();

  // send mail
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDR}>`,

    to: email,

    subject:
      purpose === 'verify'
        ? '🌤️ SkyCast Email Verification'
        : '🔐 SkyCast Login OTP',

    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>SkyCast OTP</h2>

        <p>Hello ${name || 'User'},</p>

        <p>Your OTP is:</p>

        <h1 style="letter-spacing:4px">
          ${otp}
        </h1>

        <p>
          Expires in ${expiryMins} minutes.
        </p>
      </div>
    `,

    text: `Your OTP is ${otp}`,
  });

  return true;
};

module.exports = {
  createAndSendOTP,
};