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
  console.error('❌ MONGO_URI missing in .env');
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
   STATIC FILES
──────────────────────────────────────────── */

app.use(express["static"]('public'));
/* ─────────────────────────────────────────────
   RATE LIMITING
──────────────────────────────────────────── */

app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many auth requests. Try again later.'
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

var authRoutes = require('./routes/auth');

var searchRoutes = require('./routes/search');

var adminRoutes = require('./routes/admin');

var aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
/* ─────────────────────────────────────────────
   HOME ROUTE
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
   404 API HANDLER
──────────────────────────────────────────── */

app.use('/api/*', function (req, res) {
  res.status(404).json({
    error: 'API route not found'
  });
});
/* ─────────────────────────────────────────────
   DATABASE + SERVER START
──────────────────────────────────────────── */

mongoose.connect(process.env.MONGO_URI).then(function _callee() {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log('✅ MongoDB connected');
          _context.next = 3;
          return regeneratorRuntime.awrap(seedAdmin());

        case 3:
          app.listen(PORT, function () {
            console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
          });

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
})["catch"](function (err) {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});
/* ─────────────────────────────────────────────
   ADMIN SEED
──────────────────────────────────────────── */

function seedAdmin() {
  var User, email, password, exists;
  return regeneratorRuntime.async(function seedAdmin$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          User = require('./models/User');
          _context2.prev = 1;
          email = process.env.ADMIN_EMAIL;
          password = process.env.ADMIN_PASSWORD;

          if (!(!email || !password)) {
            _context2.next = 7;
            break;
          }

          console.log('⚠️ Admin env missing, skipping admin creation');
          return _context2.abrupt("return");

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(User.findOne({
            email: email
          }));

        case 9:
          exists = _context2.sent;

          if (!exists) {
            _context2.next = 13;
            break;
          }

          console.log('👑 Admin already exists');
          return _context2.abrupt("return");

        case 13:
          _context2.next = 15;
          return regeneratorRuntime.awrap(User.create({
            name: process.env.ADMIN_NAME || 'SkyCast Admin',
            email: email,
            password: password,
            role: 'admin',
            verified: true
          }));

        case 15:
          console.log('👑 Admin created');
          _context2.next = 21;
          break;

        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](1);
          console.error('❌ Admin seed error:', _context2.t0.message);

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 18]]);
}