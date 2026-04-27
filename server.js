require('dotenv').config();

const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─────────────────────────────────────────────
   STATIC FILES (IMPORTANT FIX 🔥)
   this makes your HTML/CSS/JS work
──────────────────────────────────────────── */
app.use(express.static('public'));

/* ─────────────────────────────────────────────
   RATE LIMITING
──────────────────────────────────────────── */
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many auth requests, try again later.' }
}));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Rate limit exceeded.' }
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
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

/* ─────────────────────────────────────────────
   HEALTH CHECK
──────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

/* ─────────────────────────────────────────────
   DATABASE + SERVER START
──────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');

    seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

/* ─────────────────────────────────────────────
   ADMIN SEED FUNCTION (SAFE VERSION)
──────────────────────────────────────────── */
async function seedAdmin() {
  const User = require('./models/User');

  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log("⚠️ Admin env missing, skipping admin creation");
      return;
    }

    const exists = await User.findOne({ email });

    if (exists) {
      console.log('👑 Admin already exists');
      return;
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'SkyCast Admin',
      email,
      password,
      role: 'admin',
      verified: true,
    });

    console.log('👑 Admin created');
  } catch (err) {
    console.error('❌ Admin seed error:', err.message);
  }
}