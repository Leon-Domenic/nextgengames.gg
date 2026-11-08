import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendUserId } = await request.json();
    if (!friendUserId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    db.prepare(`
      DELETE FROM friendships
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).run(user.id, friendUserId, friendUserId, user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Remove friend error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
