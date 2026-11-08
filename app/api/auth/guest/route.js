import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { signToken, COOKIE_NAME } from '@/lib/auth';

const TOKEN_TYPES = ['hat', 'robot', 'car', 'yacht', 'rocket', 'duck', 'diamond', 'crown', 'brawler', 'mystic'];
const NEON_COLORS = ['#00f0ff', '#ff3344', '#00ff88', '#a855f7', '#f97316', '#eab308'];

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let guestName = body?.username?.trim();

    if (!guestName) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      guestName = `Tycoon#${randNum}`;
    } else {
      guestName = `Guest_${guestName.slice(0, 12)}`;
    }

    // Ensure unique username
    let finalUsername = guestName;
    let counter = 1;
    while (db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername)) {
      finalUsername = `${guestName}_${counter++}`;
    }

    const id = crypto.randomUUID();
    const color = body?.avatar_color || NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    const tokenChoice = body?.avatar_token || TOKEN_TYPES[Math.floor(Math.random() * TOKEN_TYPES.length)];
    const now = Date.now();

    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_guest, avatar_color, avatar_token, created_at)
      VALUES (?, ?, NULL, 1, ?, ?, ?)
    `).run(id, finalUsername, color, tokenChoice, now);

    db.prepare('INSERT INTO player_stats (user_id) VALUES (?)').run(id);

    const token = signToken({ id, username: finalUsername, is_guest: true });

    const response = NextResponse.json({
      success: true,
      user: {
        id,
        username: finalUsername,
        is_guest: true,
        avatar_color: color,
        avatar_token: tokenChoice,
        stats: { matches_played: 0, wins: 0, tomatoes_thrown: 0, tomatoes_hit: 0, cities_bought: 0, buyouts_executed: 0 }
      }
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days for guests
    });

    return response;
  } catch (err) {
    console.error('Guest creation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
