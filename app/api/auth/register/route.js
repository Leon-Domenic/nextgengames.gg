import { NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password, avatar_color, avatar_token } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Check if username taken
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = Date.now();
    const color = avatar_color || '#00f0ff';
    const tokenChoice = avatar_token || 'hat';

    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_guest, avatar_color, avatar_token, created_at)
      VALUES (?, ?, ?, 0, ?, ?, ?)
    `).run(id, cleanUsername, passwordHash, color, tokenChoice, now);

    db.prepare('INSERT INTO player_stats (user_id) VALUES (?)').run(id);

    const token = signToken({ id, username: cleanUsername });

    const response = NextResponse.json({
      success: true,
      user: {
        id,
        username: cleanUsername,
        is_guest: false,
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
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
