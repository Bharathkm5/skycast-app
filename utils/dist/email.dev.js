"use strict";

var nodemailer = require('nodemailer');

var Otp = require('../models/Otp'); // ── Transporter ─────────────────────────────


var createTransporter = function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}; // ── Generate OTP ────────────────────────────


var generateOTP = function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}; // ── MAIN FUNCTION ───────────────────────────


var createAndSendOTP = function createAndSendOTP(_ref) {
  var email, name, _ref$purpose, purpose, transporter, expiryMins, existing, diff, otp, expiresAt;

  return regeneratorRuntime.async(function createAndSendOTP$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          email = _ref.email, name = _ref.name, _ref$purpose = _ref.purpose, purpose = _ref$purpose === void 0 ? 'verify' : _ref$purpose;
          transporter = createTransporter();
          email = email.toLowerCase().trim(); // ✅ FIX

          expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10; // 🔍 Check existing OTP

          _context.next = 6;
          return regeneratorRuntime.awrap(Otp.findOne({
            email: email,
            purpose: purpose
          }));

        case 6:
          existing = _context.sent;

          if (!existing) {
            _context.next = 18;
            break;
          }

          diff = (Date.now() - new Date(existing.createdAt).getTime()) / 1000;

          if (!(diff < 60)) {
            _context.next = 11;
            break;
          }

          throw new Error("Wait ".concat(Math.ceil(60 - diff), " seconds before retry"));

        case 11:
          if (!(existing.expiresAt > new Date())) {
            _context.next = 16;
            break;
          }

          console.log("📩 Reusing OTP:", existing.otp); // ✅ DEBUG

          _context.next = 15;
          return regeneratorRuntime.awrap(transporter.sendMail({
            from: "\"".concat(process.env.EMAIL_FROM_NAME, "\" <").concat(process.env.EMAIL_FROM_ADDR, ">"),
            to: email,
            subject: '🔐 SkyCast — Your OTP',
            html: "\n          <h2>SkyCast OTP</h2>\n          <p>Hello ".concat(name || 'User', ",</p>\n          <h1>").concat(existing.otp, "</h1>\n          <p>Expires in ").concat(expiryMins, " minutes</p>\n        "),
            text: "Your OTP is ".concat(existing.otp)
          }));

        case 15:
          return _context.abrupt("return", true);

        case 16:
          _context.next = 18;
          return regeneratorRuntime.awrap(Otp.deleteMany({
            email: email,
            purpose: purpose
          }));

        case 18:
          // 🆕 Generate new OTP
          otp = generateOTP();
          expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);
          _context.next = 22;
          return regeneratorRuntime.awrap(Otp.create({
            email: email,
            otp: otp,
            purpose: purpose,
            expiresAt: expiresAt
          }));

        case 22:
          console.log("📩 New OTP:", otp); // ✅ DEBUG
          // 📧 Send email

          _context.prev = 23;
          _context.next = 26;
          return regeneratorRuntime.awrap(transporter.sendMail({
            from: "\"".concat(process.env.EMAIL_FROM_NAME, "\" <").concat(process.env.EMAIL_FROM_ADDR, ">"),
            to: email,
            subject: purpose === 'verify' ? '🌤️ SkyCast — Verify Your Email' : '🔐 SkyCast — Your Login OTP',
            html: "\n        <h2>SkyCast OTP</h2>\n        <p>Hello ".concat(name || 'User', ",</p>\n        <p>Your OTP is:</p>\n        <h1>").concat(otp, "</h1>\n        <p>Expires in ").concat(expiryMins, " minutes.</p>\n      "),
            text: "Your OTP is ".concat(otp)
          }));

        case 26:
          _context.next = 32;
          break;

        case 28:
          _context.prev = 28;
          _context.t0 = _context["catch"](23);
          console.error("❌ Email send failed:", _context.t0.message); // 👉 fallback (VERY IMPORTANT FOR TESTING)

          return _context.abrupt("return", {
            devOtp: otp
          });

        case 32:
          return _context.abrupt("return", true);

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[23, 28]]);
};

module.exports = {
  createAndSendOTP: createAndSendOTP
};