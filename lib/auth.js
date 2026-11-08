import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'ngg-super-secret-key-prod-proxmox-2026';
const COOKIE_NAME = 'ngg_token';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) return null;

  const stmt = db.prepare('SELECT id, username, is_guest, avatar_color, avatar_token, created_at FROM users WHERE id = ?');
  const user = stmt.get(decoded.id);
  if (!user) return null;

  const statsStmt = db.prepare('SELECT * FROM player_stats WHERE user_id = ?');
  const stats = statsStmt.get(user.id) || {
    matches_played: 0,
    wins: 0,
    tomatoes_thrown: 0,
    tomatoes_hit: 0,
    cities_bought: 0,
    buyouts_executed: 0,
  };

  return { ...user, is_guest: Boolean(user.is_guest), stats };
}

export function getOrCreateStats(userId) {
  const select = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
  if (select) return select;

  db.prepare('INSERT INTO player_stats (user_id) VALUES (?)').run(userId);
  return db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
}

export { COOKIE_NAME };
