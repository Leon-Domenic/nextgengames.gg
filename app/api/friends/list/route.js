import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Accepted Friends
    const friendsStmt = db.prepare(`
      SELECT 
        f.id AS friendship_id,
        CASE WHEN f.user_id = ? THEN u2.id ELSE u1.id END AS id,
        CASE WHEN f.user_id = ? THEN u2.username ELSE u1.username END AS username,
        CASE WHEN f.user_id = ? THEN u2.avatar_color ELSE u1.avatar_color END AS avatar_color,
        CASE WHEN f.user_id = ? THEN u2.avatar_token ELSE u1.avatar_token END AS avatar_token,
        CASE WHEN f.user_id = ? THEN u2.is_guest ELSE u1.is_guest END AS is_guest
      FROM friendships f
      JOIN users u1 ON f.user_id = u1.id
      JOIN users u2 ON f.friend_id = u2.id
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    `);
    const friends = friendsStmt.all(user.id, user.id, user.id, user.id, user.id, user.id, user.id);

    // 2. Incoming pending requests
    const incomingStmt = db.prepare(`
      SELECT 
        f.id AS request_id,
        u.id AS user_id,
        u.username,
        u.avatar_color,
        u.avatar_token,
        f.created_at
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `);
    const incoming = incomingStmt.all(user.id);

    // 3. Outgoing pending requests
    const outgoingStmt = db.prepare(`
      SELECT 
        f.id AS request_id,
        u.id AS user_id,
        u.username,
        u.avatar_color,
        u.avatar_token,
        f.created_at
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
    `);
    const outgoing = outgoingStmt.all(user.id);

    return NextResponse.json({
      success: true,
      friends,
      incoming,
      outgoing,
    });
  } catch (err) {
    console.error('Friends list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
