require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://localhost:3000', 'http://localhost:5500',
    'http://127.0.0.1:5500', 'http://localhost:8080', 'null',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 900000, max: 50,  message: { error: 'Too many requests, please try again later.' } }));
app.use('/api',      rateLimit({ windowMs: 60000,  max: 300, message: { error: 'Rate limit exceeded.' } }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin',  require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
}));

// ── MongoDB + Start ──────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected:', process.env.MONGO_URI);
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`\n🚀 SkyCast backend: http://localhost:${PORT}`);
      console.log(`📧 Email via: ${process.env.EMAIL_HOST} (${process.env.EMAIL_USER})`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV}\n`);
    });
  })
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });

async function seedAdmin() {
  const User = require('./models/User');
  const exists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!exists) {
    await User.create({
      name: process.env.ADMIN_NAME || 'SkyCast Admin',
      email: process.env.ADMIN_EMAIL || 'admin@skycast.app',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
      verified: true,
    });
    console.log('👑 Admin created:', process.env.ADMIN_EMAIL);
  } else {
    console.log('👑 Admin exists:', exists.email);
  }
}
