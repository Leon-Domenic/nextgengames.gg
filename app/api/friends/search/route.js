import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users excluding self and guests
    const stmt = db.prepare(`
      SELECT id, username, avatar_color, avatar_token
      FROM users
      WHERE username LIKE ? AND id != ? AND is_guest = 0
      LIMIT 10
    `);

    const users = stmt.all(`%${q}%`, user.id);

    // Check friendship status for each result
    const checkStmt = db.prepare(`
      SELECT status, user_id, friend_id FROM friendships
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `);

    const results = users.map((u) => {
      const rel = checkStmt.get(user.id, u.id, u.id, user.id);
      let relationship = 'none';
      if (rel) {
        if (rel.status === 'accepted') relationship = 'friend';
        else if (rel.user_id === user.id) relationship = 'pending_outgoing';
        else relationship = 'pending_incoming';
      }
      return { ...u, relationship };
    });

    return NextResponse.json({ users: results });
  } catch (err) {
    console.error('User search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
