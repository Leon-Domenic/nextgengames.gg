import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Persistence directory: supports Docker /app/data and local dev ./data
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'nextgengames.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    is_guest INTEGER DEFAULT 0,
    avatar_color TEXT DEFAULT '#00f0ff',
    avatar_token TEXT DEFAULT 'hat',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted')),
    created_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    user_id TEXT PRIMARY KEY,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    tomatoes_thrown INTEGER DEFAULT 0,
    tomatoes_hit INTEGER DEFAULT 0,
    cities_bought INTEGER DEFAULT 0,
    buyouts_executed INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
