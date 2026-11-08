import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Invalid target user' }, { status: 400 });
    }

    const target = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check existing
    const existing = db.prepare(`
      SELECT id, status, user_id FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(user.id, targetUserId, targetUserId, user.id);

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Friend request already pending' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO friendships (id, user_id, friend_id, status, created_at)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(id, user.id, targetUserId, Date.now());

    return NextResponse.json({ success: true, requestId: id });
  } catch (err) {
    console.error('Send friend request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
