require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dbFilePath = path.join(__dirname, 'users.json');

// In-memory store as fallback when no PostgreSQL is configured
const memoryStore = {
  users: [],
  nextId: 1
};

function loadUsersFromFile() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf8');
      const parsed = JSON.parse(data);
      memoryStore.users = parsed.users || [];
      memoryStore.nextId = parsed.nextId || 1;
      console.log(`💾 Loaded ${memoryStore.users.length} users from JSON file DB: ${dbFilePath}`);
    } else {
      saveUsersToFile();
    }
  } catch (err) {
    console.error('⚠️ Error loading users file:', err.message);
  }
}

function saveUsersToFile() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ Error saving users file:', err.message);
  }
}

let pool = null;
let useMemory = false;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });
} else {
  useMemory = true;
  console.log('⚡ No DATABASE_URL set — using in-memory store (data resets on restart)');
  console.log('   To use PostgreSQL, add DATABASE_URL to server/.env');
}

// Auto-create tables on startup
const initSQL = `
  CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255),
    provider    VARCHAR(50)  DEFAULT 'email',
    google_id   VARCHAR(255),
    avatar      VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS workspaces (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL DEFAULT 'My Workspace',
    plan       VARCHAR(50)  DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function initDB() {
  if (useMemory) {
    loadUsersFromFile();
    console.log('✅ JSON file database loaded and ready');
    return;
  }
  try {
    await pool.query(initSQL);
    console.log('✅ PostgreSQL database connected and tables initialized!');
  } catch (err) {
    console.error('❌ PostgreSQL init error:', err.message);
    console.log('⚡ Falling back to JSON database...');
    useMemory = true;
    pool = null;
    loadUsersFromFile();
  }
}

// Unified query interface — works with both PostgreSQL and memory store
const db = {
  // Find user by email
  async findUserByEmail(email) {
    if (useMemory) {
      return memoryStore.users.find(u => u.email === email.toLowerCase()) || null;
    }
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return res.rows[0] || null;
  },

  // Find user by Google ID
  async findUserByGoogleId(googleId) {
    if (useMemory) {
      return memoryStore.users.find(u => u.google_id === googleId) || null;
    }
    const res = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    return res.rows[0] || null;
  },

  // Find user by ID
  async findUserById(id) {
    if (useMemory) {
      return memoryStore.users.find(u => u.id === id) || null;
    }
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  // Create a new user (email/password)
  async createUser({ name, email, passwordHash }) {
    if (useMemory) {
      const user = {
        id: memoryStore.nextId++,
        name,
        email: email.toLowerCase(),
        password: passwordHash,
        provider: 'email',
        google_id: null,
        avatar: null,
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(user);
      saveUsersToFile();
      return user;
    }
    const res = await pool.query(
      `INSERT INTO users (name, email, password, provider)
       VALUES ($1, $2, $3, 'email') RETURNING *`,
      [name, email.toLowerCase(), passwordHash]
    );
    return res.rows[0];
  },

  // Create or update a Google user (upsert)
  async upsertGoogleUser({ name, email, googleId, avatar }) {
    if (useMemory) {
      let user = memoryStore.users.find(u => u.google_id === googleId || u.email === email.toLowerCase());
      if (user) {
        user.name = name;
        user.google_id = googleId;
        user.avatar = avatar;
        saveUsersToFile();
        return user;
      }
      user = {
        id: memoryStore.nextId++,
        name,
        email: email.toLowerCase(),
        password: null,
        provider: 'google',
        google_id: googleId,
        avatar,
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(user);
      saveUsersToFile();
      return user;
    }
    const res = await pool.query(
      `INSERT INTO users (name, email, provider, google_id, avatar)
       VALUES ($1, $2, 'google', $3, $4)
       ON CONFLICT (email)
       DO UPDATE SET name = EXCLUDED.name, google_id = EXCLUDED.google_id, avatar = EXCLUDED.avatar, updated_at = NOW()
       RETURNING *`,
      [name, email.toLowerCase(), googleId, avatar]
    );
    return res.rows[0];
  },

  // Update user password
  async updateUserPassword(userId, passwordHash) {
    if (useMemory) {
      const user = memoryStore.users.find(u => u.id === userId);
      if (user) {
        user.password = passwordHash;
        saveUsersToFile();
        return true;
      }
      return false;
    }
    const res = await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );
    return res.rowCount > 0;
  },

  // Get all users (admin/debug)
  async getAllUsers() {
    if (useMemory) {
      return memoryStore.users.map(u => ({ ...u, password: undefined }));
    }
    const res = await pool.query('SELECT id, name, email, provider, avatar, created_at FROM users ORDER BY created_at DESC');
    return res.rows;
  }
};

module.exports = { db, initDB };
