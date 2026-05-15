"use strict";

require('dotenv').config();

var express = require('express');

var mongoose = require('mongoose');

var cors = require('cors');

var helmet = require('helmet');

var morgan = require('morgan');

var rateLimit = require('express-rate-limit');

var app = express();
app.set('trust proxy', 1);
var PORT = process.env.PORT || 5000;
/* ─────────────────────────────────────────────
   ENV CHECK
──────────────────────────────────────────── */

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing in environment variables");
  process.exit(1);
}
/* ─────────────────────────────────────────────
   MIDDLEWARE
──────────────────────────────────────────── */


app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({
  limit: '10mb'
}));
app.use(express.urlencoded({
  extended: true
}));
/* ─────────────────────────────────────────────
   STATIC FILES (IMPORTANT FIX 🔥)
   this makes your HTML/CSS/JS work
──────────────────────────────────────────── */

app.use(express["static"]('public'));
/* ─────────────────────────────────────────────
   RATE LIMITING
──────────────────────────────────────────── */

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many auth requests, try again later.'
  }
}));
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: {
    error: 'Rate limit exceeded.'
  }
}));
/* ─────────────────────────────────────────────
   ROUTES
──────────────────────────────────────────── */

app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/admin'));
/* ─────────────────────────────────────────────
   FRONTEND ROUTE (IMPORTANT FIX 🔥)
──────────────────────────────────────────── */

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
/* ─────────────────────────────────────────────
   HEALTH CHECK
──────────────────────────────────────────── */

app.get('/api/health', function (req, res) {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});
/* ─────────────────────────────────────────────
   DATABASE + SERVER START
──────────────────────────────────────────── */

mongoose.connect(process.env.MONGO_URI).then(function () {
  console.log('✅ MongoDB connected');
  seedAdmin();
  app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
  });
})["catch"](function (err) {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
/* ─────────────────────────────────────────────
   ADMIN SEED FUNCTION (SAFE VERSION)
──────────────────────────────────────────── */

function seedAdmin() {
  var User, email, password, exists;
  return regeneratorRuntime.async(function seedAdmin$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          User = require('./models/User');
          _context.prev = 1;
          email = process.env.ADMIN_EMAIL;
          password = process.env.ADMIN_PASSWORD;

          if (!(!email || !password)) {
            _context.next = 7;
            break;
          }

          console.log("⚠️ Admin env missing, skipping admin creation");
          return _context.abrupt("return");

        case 7:
          _context.next = 9;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 9:
          exists = _context.sent;

          if (!exists) {
            _context.next = 13;
            break;
          }

          console.log('👑 Admin already exists');
          return _context.abrupt("return");

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(User.create({
            name: process.env.ADMIN_NAME || 'SkyCast Admin',
            email: email,
            password: password,
            role: 'admin',
            verified: true
          }));

        case 15:
          console.log('👑 Admin created');
          _context.next = 21;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](1);
          console.error('❌ Admin seed error:', _context.t0.message);

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 18]]);
}