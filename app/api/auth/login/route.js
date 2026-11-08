import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyPassword, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

    if (!user || user.is_guest || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username });
    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(user.id) || {};

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        is_guest: false,
        avatar_color: user.avatar_color,
        avatar_token: user.avatar_token,
        stats,
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
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
