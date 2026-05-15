"use strict";

var nodemailer = require('nodemailer');

var Otp = require('../models/Otp'); // ─────────────────────────────────────────────
// GMAIL TRANSPORTER
// ─────────────────────────────────────────────


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
}); // ─────────────────────────────────────────────
// GENERATE OTP
// ─────────────────────────────────────────────

var generateOTP = function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}; // ─────────────────────────────────────────────
// CREATE + SEND OTP
// ─────────────────────────────────────────────


var createAndSendOTP = function createAndSendOTP(_ref) {
  var email, name, _ref$purpose, purpose, otp, expiryMins, expiresAt, info;

  return regeneratorRuntime.async(function createAndSendOTP$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          email = _ref.email, name = _ref.name, _ref$purpose = _ref.purpose, purpose = _ref$purpose === void 0 ? 'verify' : _ref$purpose;
          _context.prev = 1;
          email = email.toLowerCase().trim();
          otp = generateOTP();
          expiryMins = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
          expiresAt = new Date(Date.now() + expiryMins * 60 * 1000); // remove old otp

          _context.next = 8;
          return regeneratorRuntime.awrap(Otp.deleteMany({
            email: email,
            purpose: purpose
          }));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(Otp.create({
            email: email,
            otp: otp,
            purpose: purpose,
            expiresAt: expiresAt
          }));

        case 10:
          console.log('📩 OTP GENERATED:', otp); // send email

          _context.next = 13;
          return regeneratorRuntime.awrap(transporter.sendMail({
            from: "\"".concat(process.env.EMAIL_FROM_NAME, "\" <").concat(process.env.EMAIL_FROM_ADDR, ">"),
            to: email,
            subject: purpose === 'verify' ? '🌤️ SkyCast Email Verification OTP' : '🔐 SkyCast Login OTP',
            html: "\n        <div style=\"font-family:Arial;padding:20px\">\n\n          <h2>SkyCast OTP</h2>\n\n          <p>Hello ".concat(name || 'User', ",</p>\n\n          <p>Your OTP is:</p>\n\n          <h1 style=\"letter-spacing:4px;color:#2563eb\">\n            ").concat(otp, "\n          </h1>\n\n          <p>\n            Expires in ").concat(expiryMins, " minutes.\n          </p>\n\n        </div>\n      "),
            text: "Your OTP is ".concat(otp)
          }));

        case 13:
          info = _context.sent;
          console.log('✅ Email sent:', info.messageId);
          return _context.abrupt("return", true);

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](1);
          console.error('❌ EMAIL ERROR:', _context.t0);
          throw new Error(_context.t0.message || 'Failed to send OTP email');

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 18]]);
};

module.exports = {
  createAndSendOTP: createAndSendOTP
};