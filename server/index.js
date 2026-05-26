require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'creatify_fallback_secret_2026';

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, provider: user.provider },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.createUser({ name, email, passwordHash });
    const token = signToken(user);

    console.log(`✅ New user signed up: ${name} <${email}>`);
    res.status(201).json({ token, user: sanitize(user) });

  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Server error during signup. Please try again.' });
  }
});

// POST /api/auth/signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address.' });
    }
    if (!user.password) {
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please use the Google button.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = signToken(user);
    console.log(`✅ User signed in: ${user.name} <${user.email}>`);
    res.json({ token, user: sanitize(user) });

  } catch (err) {
    console.error('Signin error:', err.message);
    res.status(500).json({ error: 'Server error during sign-in. Please try again.' });
  }
});

// POST /api/auth/google
app.post('/api/auth/google', async (req, res) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for Google sign-in.' });
    }

    // Use email as Google ID if none provided (demo mode)
    const gId = googleId || `google_${email.replace(/[^a-z0-9]/gi, '_')}`;

    const user = await db.upsertGoogleUser({ name, email, googleId: gId, avatar: avatar || null });
    const token = signToken(user);

    console.log(`✅ Google user authenticated: ${name} <${email}>`);
    res.json({ token, user: sanitize(user) });

  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Server error during Google sign-in. Please try again.' });
  }
});

// GET /api/auth/me — verify token
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided.' });

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided.' });

    const token = authHeader.replace('Bearer ', '');
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password if user has one (email provider)
    if (user.password) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Incorrect current password. Please try again.' });
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.updateUserPassword(user.id, newHash);

    console.log(`🔑 Password updated for user: ${user.name} <${user.email}>`);
    res.json({ message: 'Password updated successfully.' });

  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Server error during password update. Please try again.' });
  }
});

// GET /api/users — debug endpoint to see registered users
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Creatify API' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log('');
    console.log('✨ ─────────────────────────────────────────');
    console.log(`   CREATIFY API Server running on port ${PORT}`);
    console.log(`   → Health:  http://localhost:${PORT}/api/health`);
    console.log(`   → Users:   http://localhost:${PORT}/api/users`);
    console.log('✨ ─────────────────────────────────────────');
    console.log('');
  });
}

start();
